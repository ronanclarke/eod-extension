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
    "https://jenkins.whatclinic.net/view/ENV%20Job%20Templates/",
    "https://jenkins.whatclinic.net/view/_PROD/",
    "https://jenkins.whatclinic.net/view/_ci/",
    "https://jenkins.whatclinic.net/view/_report-db/",
    "https://jenkins.whatclinic.net/view/_dev/",
    "https://jenkins.whatclinic.net/view/Env%20dashboard/"
  ];


  sHTML += "<thead>";
  sHTML += "<th>Instance</th>";
  sHTML += "<th class='centered'>&nbsp;</th>";
  sHTML += "<th class='centered'>&nbsp;</th>";
  sHTML += "<th></th><th class='centered' colspan='2'> Builds</th>";
  sHTML += "<th></th><th class='centered' colspan='2'>Tests</th>";
  sHTML += "</thead>";

  sHTML += "<tbody><tr>";
  sHTML += "<td class=\"groupHead\" colspan='1'>EoD </td>";
  sHTML += "<td class=\"groupHead centered\" colspan='3'>Built commit</td>";
  //sHTML += "<td>&nbsp;</td>" ;
  sHTML += "<td class='groupHead centered'>IIS</td>";
  sHTML += "<td  class='groupHead centered'>CRM</td> ";
  sHTML += "<td>&nbsp;</td>";
  sHTML += "<td class='groupHead centered'>Integration</td>";
  sHTML += "<td  class='groupHead centered'>Regression</td>";
  sHTML += "</tr> ";

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

      sHTML += '<tr class="instance-row">';
      sHTML += '<td class="instance-name"><a title="Visit site" href="http://' + label + '.eod.whatclinic.net" target="_blank">' + label + "</a></td>";

      sHTML += '<td class="jenkins-tab"><a title="View Jenkins Page" href="' + view.url + '" target="_blank"><image alt="' + label + '" src="jenkins.png"/></a></td>';
      sHTML += '<td class="info-col git-status" id="' + label + '"></td>';
      sHTML += '<td class="spacer"></td>';
      sHTML += '<td class="info-col iis-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></i></td>';
      sHTML += '<td class="info-col crm-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';
      sHTML += '<td class="spacer"></td>';
      sHTML += '<td class="info-col integration-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';
      sHTML += '<td class="info-col regression-last-run" id="' + label + '"><a href="' + view.url + '" target="_blank"><i class="fa fa-spinner fa-spin"></td>';


      getJobRun('iis', view.url, label)
      getJobRun('crm', view.url, label)
      getJobRun('regression', view.url, label)
      getJobRun('integration', view.url, label)


      sHTML += "</tr>"
    }

  });

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
          getDetailsForJobRun(jobType, jobName, label)
          break;
        }
      }
    }
  });


}

function getDetailsForJobRun(jobType, jobName, label) {
  var url = jobName + "lastBuild/api/json"


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
      if (!response.building && !result) {
        markAsBlank(jobType, label);
        return;
      }


      // get the timeago string
      var timeCompleted = moment(response.timestamp);
      var timeAgo = timeCompleted.from(moment()).replace(/ago/, "");
      icon = "fa-laptop"


      var sha1 = "";
      var branchName = "";
      var startDescription = "";
      _.each(response.actions, function (action) {
        if (action["lastBuiltRevision"]) {
          sha1 = action.lastBuiltRevision.SHA1;
          var branch = _.last(action.lastBuiltRevision.branch).name
          branchName = _.last(branch.split(/\//));
        }

        if (action["causes"] && action.causes[0].shortDescription ) {
          startDescription = action.causes[0].shortDescription;
        }
      });


      var culprits = "";
      var cupritsArray = []
      _.each(response.culprits, function (culprit) {
        cupritsArray.push(culprit.fullName);
      })

      culprits = cupritsArray.join(",")
      var info = "";
      if(response.building){
        info += "\nStatus: Building"
      }else {
        info = '\nCompleted at ' + timeCompleted.format('ddd MMM Do YYYY, HH:mm:ss');
        info += "\nStatus: " + result;
      }

      if (startDescription.length > 0)
        info += "\n" + startDescription;

      info += "\nLast Commit: " + sha1.substring(0, 6);

      if (culprits.length > 0)
        info += "\nChanges By: " + culprits;


      //https://eng.whatclinic.com/git/src/iis.git/commit/?h=banned-words&id=fe74dd5bd65ff91c4a23849e570cbf644ca7ea6d
      var hrefSummary = jobName + ""
      var hrefConsole = jobName + "lastBuild/console"

      var titleSummary = 'View Job Summary' + info;
      var titleConsole = 'View Log' + info;


      if(response.building){
        var sHTML = '<a title="' + titleConsole + '" href="' + hrefConsole + '" target="_blank"><i class="fa fa-spinner fa-spin"></i><a title="' + titleSummary + '" target="_blank"href="' + hrefSummary + '"><span class="time-ago">Building</span></a>';
        $("." + jobType + "-last-run#" + label).first().html(sHTML).addClass("none");
      }else{
        var sHTML = '<a title="' + titleConsole + '" href="' + hrefConsole + '" target="_blank"><i class="fa ' + icon + '"></i><a title="' + titleSummary + '" target="_blank"href="' + hrefSummary + '"><span class="time-ago">' + timeAgo + '</span></a>';

        $("." + jobType + "-last-run#" + label).first().html(sHTML).addClass(result.toLowerCase());
      }



      if (jobType == "iis" && sha1) {
        var gitHTML = '<a target="_blank" href="https://eng.whatclinic.com/git/src/iis.git/commit/?h=' + branchName + '&id=' + sha1 + '">' + sha1.substring(0, 6) + "</a>";
        $(".git-status#" + label).first().html(gitHTML);
      }


    },
    error: function (response) {
      markAsBlank(jobType, label);
      return;
    }
  })
}
function markAsBlank(jobType, label) {
  var sHTML = "Never";
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