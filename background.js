var jenkins = jenkins || {};
jenkins.results = { lastUpdate : 'never' };

jenkins.open = function() {
    function sameUrl(orig, other) {
        if (other.indexOf(orig) !== 0)
            return false;
        return other.length === orig.length ||
            other[orig.length] === '?' ||
            other[orig.length] === '#';
    }

    return function (url) {
        chrome.tabs.getAllInWindow(undefined, function(tabs) {
            for (var i = 0, tab; tab = tabs[i]; i++) {
                if (tab.url && sameUrl(url, tab.url)) {
                    chrome.tabs.update(tab.id, { selected : true });
                    return;
                }
            }
            chrome.tabs.create({ url: url });
        });
    };
}();

jenkins.init = function (conf, results) {
    var xhr = undefined,
        timeoutId = undefined,
        successColors = /blue/,
        unknownColors = /(grey|disabled)/,
        build = {
            unknown: { msg : "?", color: [128, 128, 128, 255] },
            ok: function(nSuccesses) {
                return { msg: "+" + nSuccesses, color: [0, 128, 0, 255] };
            },
            failed: function(nFailures) {
                return { msg: "-" + nFailures, color: [255, 0, 0, 255] }
            }
        };

    function setState(state, msg) {
        console.log(state, msg, new Date());
        chrome.browserAction.setBadgeText({ text:  state.msg });
        chrome.browserAction.setBadgeBackgroundColor({ color:  state.color });
        chrome.browserAction.setTitle({ title : msg +"\nRight click for options" });
        chrome.browserAction.setPopup({ popup : "status.html" });
    }

    function onerror(msg) {
        console.log(msg);
        results.error = msg;
        setState(build.unknown, msg);
    }

    function request() {
        if (xhr)
            xhr.abort();
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onchange;
        xhr.open("GET", conf.apiURL(), true);
        try {
            xhr.send("");
        } catch (err) {
            console.log(err);
        }
    }

    function onchange() {
        if (xhr.readyState !== 4) return;
        results.lastUpdate = new Date();
        console.log("onchange", xhr);
        if (xhr.status !== 200) {
            onerror("Failed to load data: " + xhr.statusText +  " (" + xhr.status + ")");
        } else {
            display(xhr.responseText);
        }
        xhr = null;
    }

    function display(text) {
        try {
            results.jenkins = JSON.parse(text);
        } catch (e) {
            onerror("Failed to parse JSON data from " + conf.jenkinsURL() + ": " + e);
            return;
        }
        results.error = undefined;
        var nTotal = results.jenkins.jobs.length;
        var nSuccesses = 0, nUnknown = 0;
        for (var i = 0; i < nTotal; i++) {
            if (successColors.test(results.jenkins.jobs[i].color)) {
                nSuccesses++;
            } else if (unknownColors.test(results.jenkins.jobs[i].color)) {
                nUnknown++;
            }
        }
        var nFailures = nTotal - (nSuccesses + nUnknown);

        if (nTotal === nSuccesses + nUnknown) {
            setState(build.ok(nSuccesses), "Build OK");
        } else {
            setState(build.failed(nFailures), "Build Failed!");
        }
    }

    return function () {
        setState(build.unknown, "Build status unknown");
        request()
        window.setInterval(request, 60 * 1000 * conf.pollInterval());
    };

}(jenkins.conf, jenkins.results);

document.addEventListener("DOMContentLoaded", jenkins.init);
