(function () {
    "use strict";

    var officeInitialized = false;

    Office.initialize = function (reason) {
        $(document).ready(function () {

            officeInitialized = true;

            $('body').append(
                '<div id="notification-message">' +
                    '<div class="padding">' +
                        '<div id="notification-message-header"></div>' +
                        '<div id="notification-message-body"></div>' +
                    '</div>' +
                '</div>');

            $('#notification-message').click(function () {
                $('#notification-message').hide();
            });

            $('#world-bank').click(function () {
                $.ajax({ dataType: 'jsonp', jsonp: "prefix", jsonpCallback: "jquery_" + (new Date).getTime(), url: "http://api.worldbank.org/topics?format=jsonP" })
                    .done(function (topics) {
                        var topicsSelect = "<select>";
                        $.each(topics[1], function (i, topic) {
                            topicsSelect += "<option value='" + topic.id + "'>" + topic.value + "</option>";
                        });
                        topicsSelect += "</select>";
                        $("#content").append("<br/>Topics: ");
                        $(topicsSelect).appendTo('#content').select2().change(function () {
                            var topicId = $(this).val();
                            $.ajax({ dataType: 'jsonp', jsonp: "prefix", jsonpCallback: "jquery_" + (new Date).getTime(), url: "http://api.worldbank.org/topics/" + topicId + "/indicators?per_page=1000&format=jsonP" })
                                .done(function (indicators) {

                                    var indicatorsSelect = "<select id='indicators-select'>";
                                    $.each(indicators[1], function (i, indicator) {
                                        indicatorsSelect += "<option value='" + indicator.id + "'>" + indicator.name.replace("Barro-Lee: ", "").trim() + "</option>";
                                    });

                                    $("#content").append("<br/><br/>Indicators: ");

                                    $(indicatorsSelect).appendTo('#content').select2({ width: '100%' }).change(function () {
                                        var indicatorId = $(this).val();
                                        var indicatorName = $(this).select2('data')[0].text;
                                        console.log(indicatorName);
                                        if (indicatorName.length > 40)
                                            indicatorName = indicatorName.substring(0, 19);
                                        $.ajax({ dataType: 'jsonp', jsonp: "prefix", jsonpCallback: "jquery_" + (new Date).getTime(), url: "http://api.worldbank.org/countries/all/indicators/" + indicatorId + "?per_page=1000&format=jsonP" })
                                            .done(function (data) {
                                                console.log(indicatorId);
                                                console.log(data);

                                                var mappedData = data[1].filter(function (item) {
                                                    return !!item.value && !!item.country.value && !!item.date;
                                                }).map(function (item) {
                                                    return [item.country.value, item.date, item.value];
                                                });

                                                mappedData.splice(0, 0, ["Country", "Year", indicatorName]);

                                                //var mappedData = [["Product", "Qtr1", "Qtr2", "Qtr3", "Qtr4"],
                                                // ["Frames", 5000, 7000, 6544, 4377],
                                                // ["Saddles", 400, 323, 276, 651],
                                                // ["Brake levers", 12000, 8766, 8456, 9812],
                                                // ["Chains", 1550, 1088, 692, 853],
                                                // ["Mirrors", 225, 600, 923, 544],
                                                // ["Spokes", 6005, 7634, 4589, 8765]];

                                                console.log(mappedData);
                                                window.x = mappedData;

                                                Excel.run(function (ctx) {

                                                    var sheet = ctx.workbook.worksheets.getActiveWorksheet();
                                                    var range = sheet.getRange("A1:C" + mappedData.length.toString());
                                                    range.getRow(0).format.font.bold = true;
                                                    range.values = mappedData;

                                                    return ctx.sync();

                                                }).catch(errorHandler);


                                            });
                                    });
                                });
                        });
                    });
            });
        });
    }

    function errorHandler(error) {
        showNotification("Error", error);
        console.log("Error: " + error);
        if (error instanceof OfficeExtension.Error) {
            console.log("Debug info: " + JSON.stringify(error.debugInfo));
        }
    }

    function showNotification(header, content) {
        $('#notification-message-header').text(header);
        $('#notification-message-body').text(content);
        $('#notification-message').show();
    }
    
})();
