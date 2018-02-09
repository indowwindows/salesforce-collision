//if the page contains an inline edit field, watch for errors, and then inject our javascript parse the affected fields - we are injecting the script onto the page so that it can have access to and interact with salesforce javascript objects (although we are not currently using them in this version)
if (document.querySelectorAll('input[name="inlineEditSave"]').length > 0 && document.getElementById('errorDiv_ep')) {

    var actualCode = '(' + function() {

        //this is super hacky, but seems to work ok so i'm leaving it for now. (i can't find a usable salesforce javascript object that keeps track of the fields that are actually changed so the only alternative is updating everything, but that means that unedited fields will still overwrite background changes, which is no good).
        var querystring = '';

        //all fields that are edited on the page are given a class of 'inlineEditModified', so we loop through and parse all of those
        var fields = document.getElementsByClassName('inlineEditModified');
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];

            //get the field id/name
            var field_id = field.id.substr(0, field.id.indexOf('_ileinner'));

            //if it is a lookup field, also parse the record id
            var lookup_id;
            if (field.nextSibling && field.nextSibling.querySelectorAll("[id$=lkid]") && field.nextSibling.querySelectorAll("[id$=lkid]").length > 0) {
                lookup_id = field.nextSibling.querySelectorAll("[id$=lkid]")[0].value;
            }

            //set the field value to the text content of the field, unless it is a checkbox, in which case it sets the value to 1 or 0
            var field_value = field.getElementsByClassName('checkImg').length > 0 ? (field.getElementsByClassName('checkImg')[0].title == 'Checked' ? '1' : '0') : field.textContent;

            //if the text content is the word "Deleted", clear the value - this has the potential to create unexpected behavior in cases where a field is actually intended to have the value of "Deleted". Should be fixed by finding another method of detecting that the field's value was set to null.
            if (field_value == 'Deleted') field_value = '';

            //add the field name and its value to the query string
            querystring += "&" + encodeURIComponent(field_id) + '=' + encodeURIComponent(field_value);

            //separate value for lookup field ids
            if (lookup_id != null) querystring += "&" + encodeURIComponent(field_id + '_lkid') + '=' + encodeURIComponent(lookup_id);
        }

        //compound fields (name, address, etc) are stored separately in a hidden container at the bottom of the page, and so must be parsed separately
        var compound_fields = document.querySelectorAll('.inlineEditCompoundDiv input');
        for (var i = 0; i < compound_fields.length; i++) {
            var field = compound_fields[i];
            querystring += "&" + encodeURIComponent(field.id) + '=' + encodeURIComponent(field.value);
        }
        window.location.href = window.location.href + '/e?' + querystring + '&collisiondetectionautosave&retURL=' + document.location.pathname;

    } + ')();';

    // Callback function to execute when mutations are observed
    var inject = function(mutationsList) {

        for (var mutation of mutationsList) {

            if (document.getElementById("errorDiv_ep").textContent.indexOf("The record you were editing was modified by") >= 0) {

                //
                var script = document.createElement('script');
                script.textContent = actualCode;
                (document.head || document.documentElement).appendChild(script);

                observer.disconnect();
            }
        }
    };

    // Select the node that will be observed for mutations
    var targetNode = document.getElementById('errorDiv_ep');

    // Options for the observer (which mutations to observe)
    var config = { attributes: true };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(inject);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);


}
//after forwarding, if there are no ambiguous lookup fields, save the record and return automatically, otherwise just stay on the edit page
if (window.location.href.indexOf('collisiondetectionautosave') >= 0 && document.querySelectorAll('.lookupInput select').length == 0) {
    document.querySelector("#topButtonRow input[name='save']").click();
}