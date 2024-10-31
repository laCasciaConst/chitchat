"use strict";

$("#search-input").on("input", function () {
  var searchTerm = $(this).val();
  $("#date-selector").val("");
  displayChatLog(searchTerm);
});
$("#search-toggle-button").click(function () {
  $("#search-input").toggle();
});