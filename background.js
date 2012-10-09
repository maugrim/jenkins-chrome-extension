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
        successColors = /(blue|grey|disabled)/,
        build = {
            unknown: { msg : "?", color: [128, 128, 128, 255] },
            ok: function(nSuccesses, nTotal) {
                return { msg: nTotal, color: [0, 128, 0, 255] };
            },
            failed: function(nSuccesses, nTotal) {
                return { msg: "-" + (nTotal - nSuccesses), color: [255, 0, 0, 255] }
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

    function successes(jobs) {
        var n = 0;
        for (var i = 0; i < jobs.length; i++) {
            if (successColors.test(jobs[i].color)) {
                n++;
            }
        }
        return n;
    }

    function timeout() {
        console.log("timeout");
        if (xhr) {
            xhr.abort();
        }
        newRequest();
    }

    function newRequest() {
        window.setTimeout(start, 60 * 1000 * conf.pollInterval());
    }

    function start() {
        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = onchange;
        xhr.open("GET", conf.apiURL(), true);
        try {
            xhr.send("");
            timeoutId = window.setTimeout(timeout, 10 * 1000);
        } catch (err) {
            console.log(err);
        }
    }

    function onchange() {
        if (xhr.readyState !== 4) return;
        results.lastUpdate = new Date();
        console.log("onchange", xhr);
        window.clearTimeout(timeoutId);
        if (xhr.status !== 200) {
            onerror("Failed to load data: " + xhr.statusText +  " (" + xhr.status + ")");
        } else {
            display(xhr.responseText);
        }
        newRequest();
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
        var nSuccesses = successes(results.jenkins.jobs);
        if (nTotal === nSuccesses) {
            setState(build.ok(nSuccesses, nTotal), "Build OK");
        } else {
            setState(build.failed(nSuccesses, nTotal), "Build Failed!");
        }
    }

    return function () {
        setState(build.unknown, "Build status unknown");
        start();
    };

}(jenkins.conf, jenkins.results);

document.addEventListener("DOMContentLoaded", jenkins.init);
