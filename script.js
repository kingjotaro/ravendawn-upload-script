mw.loader.using(["site"]).then(function () {
  var i18n = {
    multiupload: "Upload multiple files:",
    yes: "Yes",
    no: "No",
    sourcefiles: "Source files:",
    uploadfiles: "Upload files",
    nofiles: "Please select some files first.",
    nolicense: "Please select a valid license first.",
    summary: "Summary",
    license: "Licensing",
    uploading: "Uploading files...",
    uploaded: "Uploaded:",
    failed: "Failed:",
    done: "Done.",
  };
  if (mw.config.get("wgCanonicalSpecialPageName") !== "Upload") return;
  $("#wpUploadFile").parent().parent().addClass("regularFileSelect");
  $("tr.regularFileSelect").before(
    '<tr><td class="mw-label">' +
      i18n.multiupload +
      '</td><td class="mw-input"><label><input type="radio" name="multipleFiles" value="' +
      i18n.yes +
      '" /> ' +
      i18n.yes +
      '</label> &nbsp; <label><input type="radio" name="multipleFiles" value="' +
      i18n.no +
      '" checked="" /> ' +
      i18n.no +
      "</label></td></tr>"
  );
  $("tr.regularFileSelect").after(
    '<tr class="multipleFileSelect" style="display:none;"><td class="mw-label">' +
      i18n.sourcefiles +
      '</td><td class="mw-input"><input type="file" id="multiupload" multiple /></td></tr>'
  );
  $("input[name='wpUpload']").addClass("regularFileSelect");
  $("#wpDestFile").parent().parent().addClass("regularFileSelect");
  $("#wpIgnoreWarning").parent().parent().addClass("regularFileSelect");
  $("span.mw-htmlform-submit-buttons").append(
    '<input type="button" value="' +
      i18n.uploadfiles +
      '" class="multipleFileSelect" style="display:none;" id="multiFileSubmit" />'
  );
  $("input[name='multipleFiles']").change(function () {
    if (this.value === i18n.yes) {
      $(".regularFileSelect").hide();
      $(".multipleFileSelect").show();
    } else {
      $(".regularFileSelect").show();
      $(".multipleFileSelect").hide();
    }
  });
  $("#multiFileSubmit").click(function () {
    var files = $("#multiupload")[0].files;
    if (files.length === 0) {
      alert(i18n.nofiles);
      return false;
    }
    var summary = $("#wpUploadDescription").val();
    var watch = "preferences";
    if ($("#wpWatchthis").is(":checked")) watch = "watch";
    else watch = "nochange";
    var curFile = 0;
    $("#firstHeading").text(i18n.uploading);
    $("#mw-content-text").html(
      "<h3>" +
        i18n.uploaded +
        "</h3><ul></ul><div style='display:none;' id='multiUploadFailed'><h3>" +
        i18n.failed +
        "</h3><ul></ul></div>"
    );
    function gNF() {
      if (curFile > files.length) {
        $("#mw-content-text").append("<h3>" + i18n.done + "</h3>");
        return;
      }
      if (files[curFile] === undefined) {
        curFile++;
        gNF();
        return;
       }
      $.ajax({
        url: mw.util.wikiScript("api"),
        data: { action: "query", meta: "tokens", format: "json" },
        dataType: "json",
      }).done(function (data) {
        var fd = new FormData();
        fd.append("action", "upload");
        fd.append("token", data.query.tokens.csrftoken);
      
        var originalFileName = files[curFile].name;
	var capitalizedFileName = originalFileName
		.toLowerCase()
		.replace(/_/g," ")
		.split(" ")
		.map((word) => {
			return word[0].toUpperCase() + word.slice(1);
		})
		.join(" ");
        console.log(originalFileName + '\n' + capitalizedFileName);
        fd.append("filename", capitalizedFileName);

        fd.append("file", files[curFile]);
        fd.append("comment", summary);
        fd.append("watchlist", watch);
        fd.append("ignorewarnings", 1);
        fd.append("format", "json");
        $.ajax({
          url: mw.util.wikiScript("api"),
          method: "POST",
          data: fd,
          cache: false,
          contentType: false,
          processData: false,
          type: "POST",
        })
          .done(function (d) {
            if (d.error == undefined) {
              $("#mw-content-text > ul").append(
                '<li><a href="' +
                  d.upload.imageinfo.descriptionurl +
                  '" target="_blank">' +
                  d.upload.filename +
                  "</a></li>"
              );
            } else {
              $("#multiUploadFailed ul").append(
                "<li>" +
                  files[curFile].name +
                  '&nbsp;<span title="' +
                  d.error.info +
                  '" style="cursor:help">🛈</span></li>'
              );
              $("#multiUploadFailed").show();
            }
            curFile++;
            gNF();
          })
          .fail(function (d) {
            $("#multiUploadFailed ul").append(
              "<li>" + files[curFile].name + "</li>"
            );
            $("#multiUploadFailed").show();
            curFile++;
            gNF();
          });
      });
    }
    gNF();
  });
});
