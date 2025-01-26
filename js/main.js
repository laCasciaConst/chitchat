$(document).ready(function () {
  const chatContainer = $("#chat-container");
  const searchInput = $("#search-input");
  const dateSelector = $("#date-selector");
  const tooltip = $("#tooltip");
  const calendarContainer = $("#calendar-container");
  const chatContainerWrapper = $(".outer-container");
  const searchToggleButton = $("#search-toggle-button");
  const dropdownContainer = $("#dropdown-container");
  const logSelector = $("#log-selector");
  const seenDates = new Set(); // 날짜 중복 방지용 Set

  const outerContainerWidth = $(".outer-container").width();
  const quoteBoxMaxWidth = outerContainerWidth * 0.7;

  function updateCalendarWithEvents() {
    const logsByDate = {};

    // 로그들을 날짜별로 그룹화
    $.each(chatLogs, function (key) {
      const date = key.split(", ")[0];
      if (!logsByDate[date]) {
        logsByDate[date] = [];
      }
      logsByDate[date].push(key);
    });

    // 각 날짜에 이벤트 추가
    $.each(logsByDate, function (date, logs) {
      const [year, month, day] = date.split("-").map(Number);
      const monthName = new Date(year, month - 1)
        .toLocaleString("en-US", { month: "long" })
        .toLowerCase();
      const calendarBodyId = `#${monthName}_${year}`;
      const calendarBody = $(calendarBodyId);

      if (calendarBody.length) {
        const targetDay = calendarBody
          .find(`a[data-date="${day}"]`)
          .closest("td");

        if (targetDay.length) {
          targetDay.addClass("has-events");
          targetDay.attr("data-logs", JSON.stringify(logs)); // 로그 데이터를 저장

          // 드롭다운 메뉴 추가
          if (logs.length > 1) {
            const dropdownMenu = $("<div></div>").addClass("dropdown-menu");

            logs.forEach((logKey) => {
              const title = logKey.split(", ")[1];
              const menuItem = $("<div></div>")
                .addClass("dropdown-item")
                .text(title)
                .on("click", function () {
                  displayChatLog("", logKey);
                  $("#date-selector").val(logKey); // date-selector에 로그 제목과 날짜를 설정
                  $("#calendar-container").hide();
                  $(".outer-container").css("visibility", "visible");
                  dropdownMenu.hide(); // 메뉴 닫기
                });
              dropdownMenu.append(menuItem);
            });

            targetDay.append(dropdownMenu);

            targetDay.on("mouseenter", function () {
              dropdownMenu
                .css("display", "flex")
                .css("flex-direction", "column");
              targetDay.off("click").on("click", function (event) {
                event.stopPropagation(); // 클릭 이벤트 막음
                event.preventDefault(); // 기본 동작 막음
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
    seenDates.clear(); // Set 초기화
    $("#date-selector").empty(); // 기존 옵션 비우기

    Object.keys(chatLogs).forEach((logKey) => {
      const [date, title] = logKey.split(", "); // 날짜와 제목 분리
      const displayText = title ? `${date} - ${title}` : date;

      // 날짜와 제목이 중복되지 않도록 체크
      if (!seenDates.has(displayText)) {
        seenDates.add(displayText);
        const option = $("<option></option>")
          .attr("value", logKey)
          .text(displayText.trim()); // 날짜와 제목 표시, 불필요한 공백 제거
        $("#date-selector").append(option);
      }
    });

    // 디버깅: 추가된 옵션 개수와 내용을 출력
    // console.log(
    //   "Options added to date-selector:",
    //   $("#date-selector option").length
    // );
    $("#date-selector option").each(function (index) {
      console.log(`Option ${index + 1}: ${$(this).val()} - ${$(this).text()}`);
    });
  }

  // 이벤트 핸들러
  $("#date-selector").change(function () {
    const selectedLogKey = $(this).val();
    if (selectedLogKey) {
      displayChatLog("", selectedLogKey);
      $("#calendar-container").hide();
      $(".outer-container").css("visibility", "visible");
    }
  });

  updateCalendarWithEvents();
  populateDateSelector();

  // console.log("populateDateSelector called");

  $(document).on("click", ".ui-datepicker-calendar td.has-events", function () {
    const logs = JSON.parse($(this).attr("data-logs"));

    if (logs && logs.length > 1) {
      showMenuForDate($(this), logs);
    } else if (logs && logs.length === 1) {
      displayChatLog("", logs[0]);
      $("#calendar-container").hide();
      chatContainerWrapper.show();
    }
  });

  logSelector.on("click", "td", function () {
    const selectedLog = $(this).attr("value");
    dateSelector.val(selectedLog).change();
    dropdownContainer.hide();
    calendarContainer.hide();
    chatContainerWrapper.show().css("visibility", "visible");
    searchToggleButton.show();
  });

  const appendDateDivider = (timestamp) => {
    if (!timestamp) return;

    const lastDivider = $("#chat-container").children(".date-divider").last();
    if (lastDivider.length === 0 || lastDivider.text() !== timestamp) {
      const dateDivider = $("<div></div>")
        .addClass("date-divider")
        .html(`<span>${timestamp}</span>`);

      if ($("#chat-container").children(".date-divider").length === 0) {
        dateDivider.addClass("first");
      }

      $("#chat-container").append(dateDivider);
    }
  };

  // 날짜 클릭 시 이벤트 처리
  $(document).on(
    "click",
    '.ui-datepicker-calendar td[data-handler="selectDay"] a',
    function (event) {
      const parentTd = $(this).closest("td");

      if (!parentTd.hasClass("has-events")) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const logs = parentTd.data("logs");
      const year = parentTd.data("year");
      const month = parentTd.data("month") + 1;
      const day = $(this).data("date");
      const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;

      console.log(`Selected date: ${formattedDate}`);

      $("#calendar-container").hide();
      if (logs && logs.length > 1) {
        showMenuForDate(parentTd, logs);
      } else {
        displayChatLog("", logs[0]);
      }
      $(".outer-container").css("visibility", "visible");
      $("#search-toggle-button").css("display", "block");

      $("#date-selector").val(formattedDate);
    }
  );

  const italicizeText = (text) => {
    return text.replace(/\(([^)]+)\)/g, "<i>($1)</i>");
  };

  const highlightText = (text, searchTerm) => {
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<span class="highlight">$1</span>');
  };

  const isEmojiOnly = (text) => {
    const emojiRegex =
      /^(?:[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD-\u25FE\u2600-\u2604\u260E\u2611\u2614-\u2615\u2618\u261D\u2620\u2622-\u2623\u2626\u262A\u262E-\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2694\u2696-\u2697\u2699\u269B-\u269C\u26A0-\u26A1\u26A7\u26AA-\u26AB\u26B0-\u26B1\u26BD-\u26BE\u26C4-\u26C5\u26C8\u26CE-\u26CF\u26D1\u26D3\u26D4\u26E9-\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2733-\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763-\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934-\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299\uD83C\uDC04\uD83C\uDCCF\uD83C\uDD70\uD83C\uDD71\uD83C\uDD7E\uD83C\uDD7F\uD83C\uDD8E\uD83C\uDD91-\uD83C\uDD9A\uD83C\uDDE6-\uD83C\uDDFF\uD83C\uDE01\uD83C\uDE02\uD83C\uDE1A\uD83C\uDE2F\uD83C\uDE32-\uD83C\uDE3A\uD83C\uDE50\uD83C\uDE51\uD83C\uDF00-\uD83D\uDDFF\uD83D\uDE00-\uD83D\uDE4F\uD83D\uDE80-\uD83D\uDEF6\uD83D\uDFE0-\uD83D\uDFEB\uD83D\uDFED-\uD83D\uDFFF\uD83E\uDD00-\uD83E\uDEFF\uD83F\uDFF0-\uD83F\uDFFF]|[\u200D\u20E3\uFE0F])+$/u;
    return emojiRegex.test(text.trim());
  };

  const getMediaPath = (fileName) => {
    const extensions = ["jpg", "jpeg", "png", "gif", "mp4"];
    const fileExtension = fileName.split(".").pop().toLowerCase();
    if (extensions.includes(fileExtension)) {
      return `./src/img/${fileName}`;
      console.log(`File path: ${path}`);
      return path;
    }
    return fileName;
  };

  const getDataTipPath = (dataTip) => {
    const extensions = ["jpg", "jpeg", "png", "gif"];
    const fileExtension = dataTip.split(".").pop().toLowerCase();
    if (extensions.includes(fileExtension)) {
      return `./src/dataTip/${dataTip}`;
    }
    return dataTip;
  };

  const getDataTipContent = (dataTip) => {
    let content = "";
    if (dataTip.image) {
      const imagePath = getDataTipPath(dataTip.image);
      content += `<img src="${imagePath}" alt="dataTip image">`;
    }
    if (dataTip.text) {
      const formattedText = dataTip.text
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/\\/g, "<br>");
      content += `<span>${formattedText}</span>`;
    }
    return content;
  };

  // const processMessage = (message) => {
  //   Object.keys(emojiMap).forEach((code) => {
  //     const emojiImage = emojiMap[code];
  //     if (message.includes(code)) {
  //       console.log(`Replacing ${code} with ${emojiImage}`);
  //     }
  //     message = message.replace(new RegExp(code, "g"), emojiImage);
  //   });
  //   return message;
  // };

  const processMessage = (message) => {
    return message;
  };

  const displayChatLog = (
    searchTerm = "",
    selectedDate = "",
    scrollToElement = null
  ) => {
    // 초기 설정
    $("#chat-container").empty();
    $("#no-results").hide();

    if (!selectedDate) {
      selectedDate = $("#date-selector").val();
    }

    if (!selectedDate && !searchTerm) {
      return;
    }

    const chatLog = chatLogs[selectedDate];
    if (!chatLog && !searchTerm) {
      $("#no-results").show();
      return;
    }

    appendDateDivider(selectedDate);

    let lastSender = ""; // 마지막 메시지 보낸 사람 추적
    let lastTimestamp = ""; // 마지막 타임스탬프 추적

    const logKeys = Object.keys(chatLogs).filter((key) =>
      key.startsWith(selectedDate)
    );

    if (logKeys.length > 1 && !scrollToElement && !searchTerm) {
      showMenuForDate(
        $(`#calendar-container td.has-events[data-logs='${selectedDate}']`),
        logKeys
      );
      return;
    }

    let matchingMessages = [];
    if (searchTerm) {
      Object.keys(chatLogs).forEach((date) => {
        const chatLog = chatLogs[date];
        if (chatLog) {
          chatLog.forEach((chat, index) => {
            if (
              !chat.quote &&
              chat.message.toLowerCase().includes(searchTerm.toLowerCase())
            ) {
              matchingMessages.push({ date, chat, index });
            }
          });
        }
      });
      if (matchingMessages.length === 0) {
        console.log("No results found");
        $("#no-results").show();
        return;
      }

      let lastDate = null; // 마지막으로 추가된 date-divider의 날짜

      matchingMessages.forEach(({ date, chat, index }, i) => {
        if (lastDate !== date) {
          appendDateDivider(date);
          lastDate = date;
        }

        const senderClass = chat.sender !== "L" ? "friend" : "me";
        const messageContainer = $("<div></div>")
          .addClass("message-container")
          .addClass(senderClass);

        // 클래스 추가
        if (chat.class) {
          chat.class.split(",").forEach((className) => {
            messageContainer.addClass(className.trim());
          });
        }

        if (chat.sender !== "L" && chat.sender !== lastSender) {
          const nicknameSpan = $("<span></span>")
            .addClass("nickname")
            .addClass(senderClass)
            .text(chat.sender);
          messageContainer.append(nicknameSpan);
        } else {
          messageContainer.addClass("no-nickname");
        }

        let messageDiv = $("<div></div>")
          .addClass("message")
          .addClass(senderClass);
        const mediaPath = getMediaPath(chat.message);

        if (chat.class && chat.class.includes("two-image")) {
          const images = chat.message.split("\\"); // 이미지를 '\\'로 분리
          const imageContainer = $("<div></div>")
            .addClass("image-container")
            .css({
              display: "flex", // 이미지를 가로로 나란히 배치
              gap: "15px", // 이미지 사이에 15px 간격
            });

          images.forEach((image) => {
            const imagePath = getMediaPath(image.trim());
            const imageElement = $("<img>")
              .attr("src", imagePath)
              .addClass("rounded-media")
              .css({
                maxWidth: "calc(50% - 7.5px)", // 두 이미지를 나란히 배치
                height: "auto",
              });
            imageContainer.append(imageElement);
          });

          messageContainer.append(imageContainer);
        } else {
          const mediaPath = getMediaPath(chat.message);
          if (
            mediaPath.endsWith(".jpg") ||
            mediaPath.endsWith(".png") ||
            mediaPath.endsWith(".gif")
          ) {
            messageDiv = $("<img>")
              .attr("src", mediaPath)
              .addClass("rounded-media");
            messageContainer.append(messageDiv);
          } else if (mediaPath.endsWith(".mp4")) {
            messageDiv = $("<video controls>")
              .attr("src", mediaPath)
              .addClass("rounded-media");
            messageContainer.append(messageDiv);
          } else if (isEmojiOnly(chat.message)) {
            messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
            messageContainer.append(messageDiv);
          } else {
            const formattedMessage = italicizeText(chat.message).replace(
              /\\/g,
              "<br>"
            );
            const highlightedMessage =
              highlightText(formattedMessage, searchTerm) || formattedMessage;
            const messageText = $("<span></span>").html(highlightedMessage);
            messageDiv.append(messageText);
            messageContainer.append(messageDiv);
          }
        }

        // 데이터 팁 및 반응 처리
        if (chat.dataTip) {
          const dataTipContent = getDataTipContent(chat.dataTip);
          messageDiv.attr("data-tip", dataTipContent);

          const highlightCircle = $("<div></div>").addClass("highlight-circle");
          messageContainer.append(highlightCircle);

          messageDiv.hover(
            function (event) {
              if ($(this).attr("data-tip")) {
                $("#tooltip").html($(this).attr("data-tip"));
                $("#tooltip").css({
                  top: event.pageY + 10 + "px",
                  left: event.pageX + 10 + "px",
                });
                $("#tooltip").show();
              }
            },
            function () {
              $("#tooltip").hide();
            }
          );
        }

        if (chat.reaction) {
          const reactionBox = $("<div></div>").addClass("reaction-box");
          const reactionIcon = $("<span></span>")
            .addClass("reaction-icon")
            .text(chat.reaction);
          reactionBox.append(reactionIcon);
          messageContainer.append(reactionBox);
          messageContainer.addClass("has-reaction");
        }

        $("#chat-container").append(messageContainer);

        // 이벤트 핸들러 추가: 검색 결과 메시지 클릭 시 해당 날짜로 이동
        messageContainer.on("click", function () {
          console.log("Message clicked:", date); // 디버깅용 콘솔 로그
          $("#date-selector").val(date).change();
          displayChatLog("", date, messageContainer);
        });

        lastSender = chat.sender;

        if (chat.timestamp && chat.timestamp !== lastTimestamp) {
          appendTimestampLabel(chat.timestamp);
          lastTimestamp = chat.timestamp;
        }
      });

      if (matchingMessages.length > 0) {
        if (matchingMessages[matchingMessages.length - 1].chat.reaction) {
          $("#chat-container").children().last().css("margin-bottom", "0");
        }
      }
    } else {
      chatLog.forEach((chat, index) => {
        const senderClass = chat.sender !== "L" ? "friend" : "me";
        const messageContainer = $("<div></div>")
          .addClass("message-container")
          .addClass(senderClass);

        if (chat.class) {
          chat.class.split(",").forEach((className) => {
            messageContainer.addClass(className.trim());
          });
        }

        let messageDiv = $("<div></div>")
          .addClass("message")
          .addClass(senderClass);

        let processedMessage = processMessage(chat.message);

        const isAppleStyle = processedMessage.includes("✉️");
        if (isAppleStyle) {
          messageDiv.addClass("apple-style");
          // 이모지를 제거하여 메시지를 깔끔하게 유지
          processedMessage = processedMessage
            .replace(/✉️/g, "")
            .replace(/\\/g, "<br>");

          const messageText = $("<span></span>").html(processedMessage);
          messageDiv.append(messageText);
          messageContainer.append(messageDiv);

          lastSender = chat.sender;

          if (chat.timestamp && chat.timestamp !== lastTimestamp) {
            appendTimestampLabel(chat.timestamp);
            lastTimestamp = chat.timestamp;
          }

          const nextChat = chatLog[index + 1];
          const isLastInGroup = !nextChat || nextChat.sender !== chat.sender;

          if (isLastInGroup) {
            if (senderClass === "me") {
              messageDiv.css("border-radius", "25px 25px 5px 25px");
            } else {
              messageDiv.css("border-radius", "25px 25px 25px 5px");
            }
          } else {
            messageDiv.css("border-radius", "25px");
          }

          if (chat.reaction) {
            const reactionBox = $("<div></div>").addClass("reaction-box");
            const reactionIcon = $("<span></span>")
              .addClass("reaction-icon")
              .text(chat.reaction);
            reactionBox.append(reactionIcon);
            messageContainer.append(reactionBox);
            messageContainer.addClass("has-reaction");
          }

          $("#chat-container").append(messageContainer);

          // 이벤트 핸들러 추가: 검색 결과 메시지 클릭 시 해당 날짜로 이동
          messageContainer.on("click", function () {
            console.log("Message clicked:", date); // 디버깅용 콘솔 로그
            $("#date-selector").val(date).change();
            displayChatLog("", date, messageContainer);
          });

          // 애플 메시지 스타일 적용 후 다른 처리를 하지 않도록 종료
          $("#chat-container").append(messageContainer);
          return;
        }

        if (chat.sender !== "L" && chat.sender !== lastSender) {
          const nicknameSpan = $("<span></span>")
            .addClass("nickname")
            .addClass(senderClass)
            .text(chat.sender);
          messageContainer.append(nicknameSpan);
        } else {
          messageContainer.addClass("no-nickname");
        }

        // 위와 동일하게 이미지를 처리
        const mediaPath = getMediaPath(chat.message);
        if (chat.class && chat.class.includes("two-image")) {
          const images = chat.message.split("\\");
          const imageContainer = $("<div></div>").addClass("two-image");
          images.forEach((image) => {
            const imagePath = getMediaPath(image.trim());
            const imageElement = $("<img>").attr("src", imagePath).css({
              maxWidth: "calc((100% - 15px) / 2)",
              height: "auto",
            });
            imageContainer.append(imageElement);
          });
          messageContainer.append(imageContainer);
        } else if (
          mediaPath.endsWith(".jpg") ||
          mediaPath.endsWith(".png") ||
          mediaPath.endsWith(".gif")
        ) {
          messageDiv = $("<img>")
            .attr("src", mediaPath)
            .addClass("rounded-media");
          messageContainer.append(messageDiv);
        } else if (mediaPath.endsWith(".mp4")) {
          messageDiv = $("<video controls>")
            .attr("src", mediaPath)
            .addClass("rounded-media");
          messageContainer.append(messageDiv);
        } else if (isEmojiOnly(chat.message)) {
          messageDiv = $("<div></div>").addClass("emoji").text(chat.message);
          messageContainer.append(messageDiv);
        } else {
          const formattedMessage = italicizeText(chat.message).replace(
            /\\/g,
            "<br>"
          );
          const messageText = $("<span></span>").html(formattedMessage);
          messageDiv.append(messageText);
          messageContainer.append(messageDiv);
        }

        if (chat.dataTip) {
          const dataTipContent = getDataTipContent(chat.dataTip);
          messageDiv.attr("data-tip", dataTipContent);

          const highlightCircle = $("<div></div>").addClass("highlight-circle");
          messageContainer.append(highlightCircle);

          messageDiv.hover(
            function (event) {
              const tooltip = $("#tooltip");
              let top = event.pageY + 10; 
              let left = event.pageX + 10; 
              
              const tooltipWidth = tooltip.outerWidth();
              const tooltipHeight = tooltip.outerHeight();

              if (left + tooltipWidth > $(window).width()) {
                left = event.pageX - tooltipWidth - 10; 
              }
              if (top + tooltipHeight > $(window).height()) {
                top = event.pageY - tooltipHeight - 10; 
              }

              tooltip.html($(this).attr("data-tip"));
              tooltip.css({ top: `${top}px`, left: `${left}px` });
              tooltip.show();
            },
            function () {
              $("#tooltip").hide();
            }
          );
        }

        if (chat.reaction) {
          const reactionBox = $("<div></div>").addClass("reaction-box");
          const reactionIcon = $("<span></span>")
            .addClass("reaction-icon")
            .text(chat.reaction);
          reactionBox.append(reactionIcon);
          messageContainer.append(reactionBox);
          messageContainer.addClass("has-reaction");
        }

        $("#chat-container").append(messageContainer);

        if (chat.quote) {
          const quoteBox = $("<div></div>").addClass("quote-box");

          const quoteText = $("<span></span>")
            .addClass("quote-text")
            .text(chat.quote);

          quoteBox.append(quoteText);

          // const quoteHeight =
          //   messageContainer.find(".quote-box").outerHeight() || 0;
          // const messageHeight = messageDiv.outerHeight() || 0;
          // const totalHeight = nicknameHeight + quoteHeight + messageHeight + 150;

          messageContainer.prepend(quoteBox);
          messageContainer.addClass("has-quote");
          messageContainer.css({
            // height: `${totalHeight}px`,
            position: "relative",
          });
        }

        if (index === chatLog.length - 1) {
          messageContainer.addClass("last-message");

          if (!messageContainer.find(".reaction-box").length) {
            if (messageContainer.width() < 120) {
              $("#chat-container").css("height", `calc(100% - 20px)`);
              messageContainer
                .addClass("no-height-adjust")
                .removeClass("height-adjusted");
              messageContainer.find(".timestamp-label").css("top", "0px");
            } else {
              $("#chat-container").css("height", "100%");
              messageContainer
                .addClass("height-adjusted")
                .removeClass("no-height-adjust");
              messageContainer.find(".timestamp-label").css("top", "20px");
            }
          } else {
            if (messageContainer.width() < 120) {
              $("#chat-container").css("height", `calc(100% - 20px)`);
              messageContainer
                .addClass("no-height-adjust has-reaction")
                .removeClass("height-adjusted");
              messageContainer.find(".timestamp-label").css("top", "0px");
            } else {
              $("#chat-container").css("height", "100%");
              messageContainer
                .addClass("height-adjusted has-reaction long-message")
                .removeClass("no-height-adjust");
              messageContainer.find(".timestamp-label").css("top", "20px");
            }
          }
        }

        if (chat.timestamp) {
          appendTimestampLabel(chat.timestamp);
          lastTimestamp = chat.timestamp;
        }

        lastSender = chat.sender;
      });

      if (chatLog.length > 0) {
        const lastChat = chatLog[chatLog.length - 1];

        if (lastChat && lastChat.reaction) {
          $("#chat-container").children().last().css("margin-bottom", "0");
        }
      }

      // 스크롤할 요소가 지정된 경우 스크롤
      if (scrollToElement) {
        setTimeout(() => {
          scrollToMessage(scrollToElement);
        }, 100);
      }
    }
  };

  function showMenuForDate(targetTd, logs) {
    const menu = $("<div></div>").addClass("log-menu");
    logs.forEach((logKey) => {
      const title = logKey.split(", ")[1];
      const menuItem = $("<div></div>").addClass("log-menu-item").text(title);
      menuItem.on("click", function () {
        displayChatLog("", logKey);
        $("#calendar-container").hide();
        $(".outer-container").show();
        menu.remove(); // 메뉴를 닫음
      });
      menu.append(menuItem);
    });
    targetTd.append(menu);
  }

  const scrollToMessage = (messageElement) => {
    const container = chatContainer[0];
    const containerHeight = container.clientHeight;
    const messageTop = messageElement.offsetTop;
    const messageHeight = messageElement.clientHeight;

    const scrollPosition = messageTop - containerHeight / 2 + messageHeight / 2;
    container.scrollTo({ top: scrollPosition, behavior: "smooth" });
  };

  const appendTimestampLabel = (timestamp) => {
    if (!timestamp) return;

    const lastMessage = chatContainer.children().last();
    const lastTimestampLabel = lastMessage.find(".timestamp-label").text();

    if (lastTimestampLabel !== timestamp) {
      const timestampLabel = $("<div></div>")
        .addClass("timestamp-label")
        .text(timestamp);
      lastMessage.append(timestampLabel);
    }
  };

  $("#search-input").on("input", function () {
    const searchTerm = $(this).val();
    $("#date-selector").val("");
    displayChatLog(searchTerm);
  });

  $("#search-toggle-button").click(function () {
    $("#search-input").toggle();
  });

  displayChatLog();
});
