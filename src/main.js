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
    "https://jenkins.whatclinic.net/view/ENV%20local-db/",
    "https://jenkins.whatclinic.net/view/ENV%20report-db/",
    "https://jenkins.whatclinic.net/view/ENV%20image/",
    "https://jenkins.whatclinic.net/view/_PROD/",
    "https://jenkins.whatclinic.net/view/_ci/"
  ];


  sHTML += "<thead><th>Instance</th><th>Jenkins Tab</th></thead>";
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
      sHTML += '<td class="instance-name"><a href="http://' + label + '.eod.whatclinic.net" target="_blank">' + label + "</a></td>"
      sHTML += '<td class="integration-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><image alt="' + label + '" src="jenkins.png"/></a></td>';
      sHTML += '<td class="jenkins-tab"><a href="' + view.url + '" target="_blank"><image alt="' + label + '" src="jenkins.png"/></a></td>';

      getLastIntegrationTestRun(view.url)
      sHTML += "</tr>"
    }

  });

  sHTML += "<tr><td class=\"groupHead\" colspan='2'>Legacy </td> ";

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

function getLastIntegrationTestRun(baseUrl) {

  var jsonUrl = baseUrl + "api/json?pretty=true";
  var x = new XMLHttpRequest();
  x.open('GET', jsonUrl);
  x.responseType = 'json';
  x.send();
  x.onload = function () {

    var response = x.response;
    if(!response || !response.jobs)
      return;

    for(i = 0; i< response.jobs.length -1;i++){
      var jobName = response.jobs[i].url
      if(jobName.indexOf("integration") > -1){
        getLastJobRun(jobName)
      }
    }

  }
}

function getLastJobRun(jobName){
  var jsonUrl = jobName + "api/json?pretty=true";
  var x = new XMLHttpRequest();
  x.open('GET', jsonUrl);
  x.responseType = 'json';
  x.send();
  x.onload = function () {

    var response = x.response;
    if(!response || !response.builds || response.builds.length < 1)
      return;

    jsonUrl = response.builds[0].url + "api/json"

    var y = new XMLHttpRequest();
    y.open('GET', jsonUrl);
    y.responseType = 'json';
    y.send();
    y.onload = function () {

    }
  }
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