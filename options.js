jenkins.options = function(conf) {
    var jenkinsUrlTextbox, pollIntervalTextbox, cancelButton, saveButton, saveStatus, iconSize;

    function showSaveStatus(show) {
        saveStatus.style.display = show ? '' : "none";
        saveButton.disabled = show;
    }

    function display() {
        jenkinsUrlTextbox.value = conf.jenkinsURL();
        pollIntervalTextbox.value = conf.pollInterval();
        document.getElementById(conf.iconSize()).checked = true;
        document.getElementById(conf.successColor()).checked = true;
        saveButton.disabled = true;
    }

    function getIconSize() {
        if (document.optionForm.small.checked) {
            return document.optionForm.small.value;
        } else if (document.optionForm.medium.checked) {
            return document.optionForm.medium.value;
        } else if (document.optionForm.large.checked) {
            return document.optionForm.large.value;
        }
    }

    function getSuccessColor() {
        if (document.optionForm.blue.checked) {
            return document.optionForm.blue.value;
        } else if (document.optionForm.green.checked) {
            return document.optionForm.green.value;
        }
    }

    return {
        save : function () {
            conf.set({
                jenkinsURL : jenkinsUrlTextbox.value,
                pollInterval: pollIntervalTextbox.value,
                iconSize: getIconSize(),
                successColor: getSuccessColor()
            });
            showSaveStatus(true);
            display();
            chrome.extension.getBackgroundPage().jenkins.init();
        },

        init : function () {
            jenkinsUrlTextbox = document.getElementById("jenkins-url");
            pollIntervalTextbox = document.getElementById("poll-interval");
            cancelButton = document.getElementById("cancel-button");
            saveButton = document.getElementById("save-button");
            saveStatus = document.getElementById("save-status");

            cancelButton.addEventListener("click", jenkins.options.init);
            saveButton.addEventListener("click", jenkins.options.save);

            var inputs = [document.getElementById("jenkins-url"), document.getElementById("poll-interval")];
            var radios = [
                document.optionForm.small,
                document.optionForm.medium,
                document.optionForm.large,
                document.optionForm.blue,
                document.optionForm.green
            ];

            var markDirty = function () { showSaveStatus(false); };

            for (var i = 0; i < inputs.length; i++) {
                inputs[i].addEventListener("input", markDirty);
            }

            for (var j = 0; j < radios.length; j++) {
                radios[j].addEventListener("change", markDirty);
            }

            display();
        }
    };
}(jenkins.conf);

document.addEventListener("DOMContentLoaded", jenkins.options.init);
