"use strict";

// Calendar day click event
$(document).on("click", ".ui-datepicker-calendar td.has-events", function () {
  var logs = JSON.parse($(this).attr("data-logs"));

  if (logs.length === 1) {
    displayChatLog("", logs[0]);
    $("#calendar-container").hide();
    $(".outer-container").css("visibility", "visible");
  } else if (logs.length > 1) {
    showMenuForDate($(this), logs);
  }
}); // Log selector click event

logSelector.on("click", "td", function () {
  var selectedLog = $(this).attr("value");
  dateSelector.val(selectedLog).change();
  dropdownContainer.hide();
  calendarContainer.hide();
  chatContainerWrapper.show().css("visibility", "visible");
  searchToggleButton.show();
});