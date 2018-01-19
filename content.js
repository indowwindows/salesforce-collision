//if the page contains an inline edit field, watch for edits, and then inject our javascript to capture the xhr request
if (document.querySelectorAll('input[name="inlineEditSave"]').length > 0) {
    var actualCode = '(' + function () {

        var requestbody = '';

        var open = window.XMLHttpRequest.prototype.open,
            send = window.XMLHttpRequest.prototype.send;

        function openReplacement(method, url, async, user, password) {
            this._url = url;
            return open.apply(this, arguments);
        }

        function sendReplacement(data) {
            if (this.onreadystatechange) {
                this._onreadystatechange = this.onreadystatechange;
            }
            if (this._url == "/ui/common/InlineEditEntitySave") {
                requestbody = data;
            }

            this.onreadystatechange = onReadyStateChangeReplacement;
            return send.apply(this, arguments);
        }

        function onReadyStateChangeReplacement() {

            if (this._url == "/ui/common/InlineEditEntitySave" && this.readyState == 4 && this.responseText.indexOf("The record you were editing was modified by") >= 0) {
                window.location.href = window.location.href + '/e?' + requestbody.replace(/&save=1/, '') + '&collisiondetectionautosave&retURL=' + document.location.pathname
            }

            if (this._onreadystatechange) {
                return this._onreadystatechange.apply(this, arguments);
            }
        }

        window.XMLHttpRequest.prototype.open = openReplacement;
        window.XMLHttpRequest.prototype.send = sendReplacement;

    } + ')();';

    var inject = function () {
        var script = document.createElement('script');
        script.textContent = actualCode;
        (document.head || document.documentElement).appendChild(script);
        script.remove();

        observer.disconnect();
    };
    
    var observer = new MutationObserver(inject);
    observer.observe(document.querySelector("#topButtonRow input[name='inlineEditSave']"), { attributes: true });
}

//after forwarding, if there are no ambiguous lookup fields, save the record and return automatically, otherwise just stay on the edit Zpage
if (window.location.href.indexOf('collisiondetectionautosave') >= 0 && document.querySelectorAll('.lookupInput select').length == 0) {
    document.querySelector("#topButtonRow input[name='save']").click();
}