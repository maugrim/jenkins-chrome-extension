jenkins.options = function(conf) {
    var jenkinsUrlTextbox, pollIntervallTextbox, cancelButton, saveButton, saveStatus, iconSize;

    function showSaveStatus(show) {
        saveStatus.style.display = show ? '' : "none";
        saveButton.disabled = show;
    }

    function display() {
        jenkinsUrlTextbox.value = conf.jenkinsURL();
        pollIntervallTextbox.value = conf.pollIntervall();
		document.getElementById(conf.iconSize()).checked = true;
		document.getElementById(conf.successColor()).checked = true;
        saveButton.disabled = true;
    }

	function getIconSize() {
		if (document.optionForm.small.checked) {
			return document.optionForm.small.value;
		} if (document.optionForm.medium.checked) {
			return document.optionForm.medium.value;
		} if (document.optionForm.large.checked) {
			return document.optionForm.large.value;
		}
	}
	
	function getSuccessColor() {
		if (document.optionForm.blue.checked) {
			return document.optionForm.blue.value;
		} if (document.optionForm.green.checked) {
			return document.optionForm.green.value;
		}
	}

    return { 
        save : function () {
            conf.set({ 
                jenkinsURL : jenkinsUrlTextbox.value,
                pollIntervall: pollIntervallTextbox.value,
				iconSize: getIconSize(),
				successColor: getSuccessColor()
            });
            showSaveStatus(true);
            display();
            chrome.extension.getBackgroundPage().jenkins.init();
        },

        init : function () {
            jenkinsUrlTextbox = document.getElementById("jenkins-url");
            pollIntervallTextbox = document.getElementById("poll-intervall");
            cancelButton = document.getElementById("cancel-button");
            saveButton = document.getElementById("save-button");
            saveStatus = document.getElementById("save-status");

            cancelButton.addEventListener("click", jenkins.options.init);
            saveButton.addEventListener("click", jenkins.options.save);

            var inputs = [document.getElementById("jenkins-url"), document.getElementById("poll-intervall")];
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
