//
//
//


function renderStatus(statusText) {
    document.getElementById('status').innerHTML = statusText;
}

function buildHTMLfromViews(views) {

    renderStatus("");
    
    if (views.length < 1) {
        renderStatus("no EoD instances found");
        return;
    }

    var sHTML = "<table>";

    var ignoreList = [
        "https://jenkins.whatclinic.net/",
        "https://jenkins.whatclinic.net/view/Automation/",
        "https://jenkins.whatclinic.net/view/ENV/",
        "https://jenkins.whatclinic.net/view/ENV%20eod/",
        "https://jenkins.whatclinic.net/view/ENV%20eod/",
        "https://jenkins.whatclinic.net/view/ENV%20image/"
    ];


    sHTML += "<thead><th>Instance</th><th>Jenkins Tab</th></thead>";
    sHTML += "<tbody>";
    _.each(views, function (view) {


        if (!_.contains(ignoreList, view.url)) {
            var label = view.url.replace("https://jenkins.whatclinic.net/view/ENV%20", "").replace("/", "");

            sHTML += "<tr>";
            sHTML += '<td class="instance-name"><a href="http://no-cache.' + label + '.varnish.whatclinic.net" target="_blank">' + label + "</a></td>"
            sHTML += '<td class="jenkins-tab"><a href="' + view.url + '" target="_blank"><image src="jenkins.png"/></a></td>';

            sHTML += "</tr>"
        }


    });

    sHTML += "</tbody></table>";

    document.getElementById('results').innerHTML = sHTML;

}

function getInstancesFromJenkins() {
    var searchUrl = 'https://jenkins.whatclinic.net/api/json?pretty=true';
    console.log("hitting " + searchUrl);
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    // The Google image search API responds with JSON, so let Chrome parse it.
    x.responseType = 'json';
    x.onload = function () {
        var response = x.response;

        if (!response || !response.views) {
            console.log("error fetching");
            return;
        }

        buildHTMLfromViews(response.views);
    };
    x.onerror = function(e){
        renderStatus('Not authenticated ... please <a class="login" href="https://jenkins.whatclinic.net" target="_blank">login</a> manually first');
    }
    console.log("about to send")
    x.send();
}


document.addEventListener('DOMContentLoaded', function () {

    renderStatus("loading ... please wait");
    getInstancesFromJenkins();

});