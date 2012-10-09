var jenkins = jenkins || {};
jenkins.conf = function () {
    var default_url = "http://ci.jenkins-ci.org/",
    default_pollInterval = 10;

    function setPollInterval(minutes) {
        var pollInterval = parseInt(minutes);
        if (0 < pollInterval && pollInterval < (24 * 60)) {
            localStorage.pollInterval = pollInterval;
        }
    }

    function setJenkinsURL(url) {
        var slash = '/';
        if (slash !== url.substr( url.length  - slash.length, slash.length ) ) {
            url = url + slash;
        }
        localStorage.jenkinsUrl = url;
    }

    function get(name, defaultValue) {
        return function() {
            if (localStorage[name]) {
                return localStorage[name];
            }
            return defaultValue;
        }
    }

    function setIconSize(size) {
	localStorage.iconSize = size;
    }

    function setSuccessColor(color) {
	localStorage.successColor = color;
    }

    return {
        pollInterval : get('pollInterval', default_pollInterval),
        jenkinsURL : get('jenkinsUrl', default_url),
	iconSize: get('iconSize', "medium"),
	successColor: get('successColor', "blue"),
        set : function (values) {
            setPollInterval(values.pollInterval);
            setJenkinsURL(values.jenkinsURL);
	    setIconSize(values.iconSize);
	    setSuccessColor(values.successColor);
        },
        apiURL : function() {
            return this.jenkinsURL() + "api/json/";
        }
    }
}();
