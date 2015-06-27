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
        "https://jenkins.whatclinic.net/view/All/",
        "https://jenkins.whatclinic.net/view/ENV/",
        "https://jenkins.whatclinic.net/view/ENV%20eod/",
        "https://jenkins.whatclinic.net/view/Varnish/",
        "https://jenkins.whatclinic.net/view/_local-db/",
        "https://jenkins.whatclinic.net/view/ENV%20image/",
        "https://jenkins.whatclinic.net/view/_PROD/",
        "https://jenkins.whatclinic.net/view/_ci/",
        "https://jenkins.whatclinic.net/view/_report-db/",
        "https://jenkins.whatclinic.net/view/_dev/",
        "https://jenkins.whatclinic.net/view/Env%20dashboard/"
    ];


    sHTML += "<thead><th>Instance</th><th>IIS</th><th>CRM</th><th>Integration</th><th>Regression</th><th>Jenkins Tab</th></thead>";
    sHTML += "<tbody>";
    sHTML += "<tr><td class=\"groupHead\" colspan='2'>EoD </td> ";

    var envPattern = "https://jenkins.whatclinic.net/view/ENV%20";
    var separatorAdded = false;
    _.each(views, function (view) {


        if (!_.contains(ignoreList, view.url)) {

            var label = "";
            if (view.url.indexOf(envPattern) > -1) {
                label = view.url.replace(envPattern, "").replace("/", "");
            } else {
                if (!separatorAdded) {
                    sHTML += "<tr><td class=\"groupHead\" colspan='2'>Fixed </td> ";
                    separatorAdded = true;
                }
                label = view.url.replace("https://jenkins.whatclinic.net/view/_", "").replace("/", "");
            }

            sHTML += "<tr>";
            sHTML += '<td class="instance-name"><a href="http://' + label + '.eod.whatclinic.net" target="_blank">' + label + "</a></td>";

            sHTML += '<td class="info-col iis-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></i></td>';
            sHTML += '<td class="info-col crm-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';

            sHTML += '<td class="info-col integration-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';
            sHTML += '<td class="info-col regression-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';

            sHTML += '<td class="jenkins-tab"><a href="' + view.url + '" target="_blank"><image alt="' + label + '" src="jenkins.png"/></a></td>';


            getJobRun('iis', view.url, label)
            getJobRun('crm', view.url, label)
            getJobRun('regression', view.url, label)
            getJobRun('integration', view.url, label)


            sHTML += "</tr>"
        }

    });

    //sHTML += "<tr><td class=\"groupHead\" colspan='2'>Legacy </td> ";
    //
    //sHTML += "<tr>";
    //sHTML += '<td class="instance-name"><a href="http://no-cache.en.staging.varnish.whatclinic.com" target="_blank">Staging</a></td>'
    //sHTML += '<td class="jenkins-tab"><a href="https://eng.whatclinic.com/jenkins/view/Eng%20Staging/" target="_blank"><image src="jenkins.png"/></a></td>';
    //sHTML += "</tr>"
    //
    //sHTML += "<tr>";
    //sHTML += '<td class="instance-name"><a href="http://no-cache.en.dev.varnish.whatclinic.com" target="_blank">Dev</a></td>'
    //sHTML += '<td class="jenkins-tab"><a href="https://eng.whatclinic.com/jenkins/view/Eng%20Dev/" target="_blank"><image src="jenkins.png"/></a></td>';
    //sHTML += "</tr>"


    sHTML += "</tbody></table>";

    document.getElementById('results').innerHTML = sHTML;

}

function getJobRun(jobType, baseUrl, label) {

    var jsonUrl = baseUrl + "api/json";


    $.ajax({
        url: jsonUrl,
        success: function (response) {

            if (!response || !response.jobs) {
                markAsBlank(jobType, label)
                return;
            }

            for (i = 0; i < response.jobs.length - 1; i++) {
                var jobName = response.jobs[i].url
                if (jobName.indexOf(jobType) > -1) {
                    getLastJobRun(jobType, jobName, label)
                    break;
                }
            }
        }
    });


}

function getLastJobRun(jobType, jobName, label) {

    var jsonUrl = jobName + "api/json";
    console.log("start getDetailsForJob()")
    $.ajax({

        url: jsonUrl,
        success: function (response) {
            if (!response || !response.builds || response.builds.length < 1) {
                markAsBlank(jobType, label)
                return;
            }
            console.log("finishing getDetailsForJob() " + response.builds.length)

            getDetailsForJobRun(jobType, response.builds[0].url, label);
        }
    });
}

function getDetailsForJobRun(jobType, jobName, label) {
    var url = jobName + "api/json"
    $.ajax({
        url: url,
        success: function (response) {
            if (!response)
                return;

            // calc the result and what icon to show
            var result = response.result;
            var icons = {
                "SUCCESS": "fa-check",
                "UNSTABLE": "fa-check",
                "ABORTED": "fa-user-times",
                "FAILURE": "fa-times"
            }

            var icon = icons[result];
            if (!result) {
                markAsBlank(jobType, label)
                return;
            }
            // get the timeago string
            var timeCompleted = moment(response.timestamp);
            var timeAgo = timeCompleted.from(moment());

            var sHTML = '<i class="fa ' + icon + '"></i><span class="time-ago">' + timeAgo + '</span>';

            $("." + jobType + "-last-run#" + label).first().html(sHTML).addClass(result.toLowerCase());

            console.log(result + ":" + timeCompleted)
        }
    })
}

function markAsBlank(jobType, label) {
    console.log("mark as blank" + jobType, label);
    var sHTML = "-";
    $("." + jobType + "-last-run#" + label).first().html(sHTML).addClass("none");
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
    console.log("ronan here")
    renderStatus("loading ... please wait");
    getInstancesFromJenkins();

});