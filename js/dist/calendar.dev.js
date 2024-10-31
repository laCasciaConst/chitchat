"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function updateCalendarWithEvents() {
  var logsByDate = {}; // Group logs by date

  $.each(chatLogs, function (key) {
    var date = key.split(", ")[0];

    if (!logsByDate[date]) {
      logsByDate[date] = [];
    }

    logsByDate[date].push(key);
  }); // Add events for each date

  $.each(logsByDate, function (date, logs) {
    var _date$split$map = date.split("-").map(Number),
        _date$split$map2 = _slicedToArray(_date$split$map, 3),
        year = _date$split$map2[0],
        month = _date$split$map2[1],
        day = _date$split$map2[2];

    var monthName = new Date(year, month - 1).toLocaleString("en-US", {
      month: "long"
    }).toLowerCase();
    var calendarBodyId = "#".concat(monthName, "_").concat(year);
    var calendarBody = $(calendarBodyId);

    if (calendarBody.length) {
      var targetDay = calendarBody.find("a[data-date=\"".concat(day, "\"]")).closest("td");

      if (targetDay.length) {
        targetDay.addClass("has-events");
        targetDay.attr("data-logs", JSON.stringify(logs)); // Save log data
        // Add dropdown for multiple logs

        if (logs.length > 1) {
          var dropdownMenu = $("<div></div>").addClass("dropdown-menu");
          logs.forEach(function (logKey) {
            var title = logKey.split(", ")[1];
            var menuItem = $("<div></div>").addClass("dropdown-item").text(title).on("click", function () {
              displayChatLog("", logKey);
              $("#date-selector").val(logKey);
              $("#calendar-container").hide();
              $(".outer-container").css("visibility", "visible");
              dropdownMenu.hide();
            });
            dropdownMenu.append(menuItem);
          });
          targetDay.append(dropdownMenu);
          targetDay.on("mouseenter", function () {
            dropdownMenu.css("display", "flex").css("flex-direction", "column");
            targetDay.off("click").on("click", function (event) {
              event.stopPropagation();
              event.preventDefault();
            });
          });
          targetDay.on("mouseleave", function () {
            dropdownMenu.hide();
          });
        }
      }
    }
  });
}

function populateDateSelector() {
  var seenDates = new Set(); // Avoid duplicates

  $("#date-selector").empty(); // Clear existing options

  Object.keys(chatLogs).forEach(function (logKey) {
    var _logKey$split = logKey.split(", "),
        _logKey$split2 = _slicedToArray(_logKey$split, 2),
        date = _logKey$split2[0],
        title = _logKey$split2[1];

    var displayText = title ? "".concat(date, " - ").concat(title) : date;

    if (!seenDates.has(displayText)) {
      seenDates.add(displayText);
      var option = $("<option></option>").attr("value", logKey).text(displayText.trim());
      $("#date-selector").append(option);
    }
  });
}