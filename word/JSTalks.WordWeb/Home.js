/// <reference path="/Scripts/FabricUI/MessageBanner.js" />

(function () {
    "use strict";

    var messageBanner;
    var baseServerUrl = "http://jstalksserver.com";

    Office.initialize = function (reason) {
        $(document).ready(function () {
            var element = document.querySelector('.ms-MessageBanner');
            messageBanner = new fabric.MessageBanner(element);
            messageBanner.hideBanner();

            var association = Office.context.document.settings.get('associated-article');
            if (association) {
                $("#publish-article span").text("Republish article");
                $("#title-container").html("Document is associated to article " + association);
            }
            else {
                $("#articles-container").show();
                $("#get-articles").click(function () {
                    $.ajax({
                        url: baseServerUrl + "/api/WordApi/GetAllPosts",
                        dataType: 'json',
                        type: "GET",
                        cache: false,
                        success: function (data) {
                            var html = "<ul>";
                            $.each(data, function (i, item) {
                                html += "<li class='article'>" + item + "</li>";
                            });
                            html += "</ul>";
                            $("#articles-container").html(html);
                        },
                        error: function (error) {
                            $("#response").html("error: " + error.responseText);
                        }
                    });
                });

                $("#articles-container").on("click", ".article", function () {
                    $.ajax({
                        url: baseServerUrl + "/api/WordApi/GetPost?post=" + $(this).text(),
                        dataType: 'json',
                        type: "GET",
                        cache: false,
                        success: function (data) {
                           
                            Word.run(function (context) {
                                context.document.body.insertHtml(data, "Start");
                                return context.sync();
                            });

                        },
                        error: function (error) {
                            $("#response").html("error: " + error.responseText);
                        }
                    });
                });
                
            }

            $('#publish-article').click(function () {
                publishArticle(association);
            });
        });
    };

    function publishArticle(association) {

        $("#response").html("Publishing article ...");

        Word.run(function (context) {

            try {
                var html = context.document.body.getHtml();
                var pics = context.document.body.inlinePictures;
                context.load(pics, 'id,hyperlink');

                return context.sync().then(function () {

                    for(var i = 0; i < pics.items.length; i++) {
                        var pic = pics.items[i];
                        context.load(pic);
                        var str = pic.getBase64ImageSrc();
                    }

                    return context.sync().then(function () {
                        
                        var sanitized = html.m_value;
                        if (str && str.value) {
                            var imgSrc = "data:image/png;base64," + str.value;
                            sanitized = sanitized.replace(/(<img[\w\W]*?src=")(.*?)(".*?>)/, "$1" + imgSrc + "$3");
                        }

                        var data = {
                            body: sanitized
                        };

                        if (association)
                            data.title = association;
                        else
                            data.title = $("#postTitle").val();

                        $.ajax({
                            url: baseServerUrl + "/api/WordApi/CreatePost",
                            data: JSON.stringify(data),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            cache: false,
                            type: "POST",
                            method: "POST",
                            success: function (response) {
                                var url = baseServerUrl + "/posts/" + data.title + ".htm";
                                var href = $("<a></a>").attr("href", url).text(url);

                                Office.context.document.settings.set('associated-article', data.title);
                                Office.context.document.settings.saveAsync();

                                $("#response").empty().append("Successfully published article at url ").append(href);
                                
                            },
                            error: function (error) {
                                $("#response").html("error: " + JSON.stringify(error));
                            }
                        });

                    });

                }).then(context.sync);

            }
            catch (error) {
                errorHandler(error);
            }

        }).catch(errorHandler);

    }

    function errorHandler(error) {
        showNotification("Error:", error);
        console.log("Error: " + error);
        if (error instanceof OfficeExtension.Error) {
            console.log("Debug info: " + JSON.stringify(error.debugInfo));
        }
    }

    function showNotification(header, content) {
        $("#notificationHeader").text(header);
        $("#notificationBody").text(content);
        messageBanner.showBanner();
        messageBanner.toggleExpansion();
    }
})();
