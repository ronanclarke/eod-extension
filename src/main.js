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
            sHTML += '<td class="instance-name"><a href="http://' + label + '.eod.whatclinic.net" target="_blank">' + label + "</a></td>"
            sHTML += '<td class="jenkins-tab"><a href="' + view.url + '" target="_blank"><image alt="' + label + '" src="jenkins.png"/></a></td>';
            sHTML += "</tr>"
        }

    });

    sHTML += "<tr><td colspan='2'>----------------------------</td> ";

    sHTML += "<tr>";
    sHTML += '<td class="instance-name"><a href="http://no-cache.en.staging.varnish.whatclinic.com" target="_blank">Staging</a></td>'
    sHTML += '<td class="jenkins-tab"><a href="https://eng.whatclinic.com/jenkins/view/Eng%20Staging/" target="_blank"><image src="jenkins.png"/></a></td>';
    sHTML += "</tr>"

    sHTML += "<tr>";
    sHTML += '<td class="instance-name"><a href="http://no-cache.en.dev.varnish.whatclinic.com" target="_blank">Dev</a></td>'
    sHTML += '<td class="jenkins-tab"><a href="https://eng.whatclinic.com/jenkins/view/Eng%20Dev/" target="_blank"><image src="jenkins.png"/></a></td>';
    sHTML += "</tr>"


    sHTML += "</tbody></table>";

    document.getElementById('results').innerHTML = sHTML;

}

function getInstancesFromJenkins() {
    var searchUrl = 'https://jenkins.whatclinic.net/api/json?pretty=true';
    var timer = setTimeout(function () {
        x.abort();
        renderLogin();
    }, 4000);
    console.log("hitting " + searchUrl);
    var x = new XMLHttpRequest();
    x.open('GET', searchUrl);
    // The Google image search API responds with JSON, so let Chrome parse it.
    x.responseType = 'json';

    x.onload = function () {
        clearTimeout(timer);
        var response = x.response;
        if (!response || !response.views) {
            renderLogin();
            return;
        }

        buildHTMLfromViews(response.views);
    };


    x.onerror = function (e) {
        renderLogin()
    }
    console.log("about to send")
    x.send();
}

function renderLogin() {
    renderStatus('Not authenticated ... please <a class="login" href="https://jenkins.whatclinic.net" target="_blank">login</a> manually first');
}

document.addEventListener('DOMContentLoaded', function () {

    renderStatus("loading ... please wait");
    getInstancesFromJenkins();

});