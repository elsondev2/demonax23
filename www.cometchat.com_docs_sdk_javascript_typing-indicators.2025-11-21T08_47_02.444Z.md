[Skip to main content](https://www.cometchat.com/docs/sdk/javascript/typing-indicators#content-area)

[CometChat Docs home page![light logo](https://mintcdn.com/cometchat-22654f5b/5LHnV4qjM_q6Hr4t/logo/light.svg?fit=max&auto=format&n=5LHnV4qjM_q6Hr4t&q=85&s=dfae9042f66fbbfefa700530f846b507)![dark logo](https://mintcdn.com/cometchat-22654f5b/5LHnV4qjM_q6Hr4t/logo/dark.svg?fit=max&auto=format&n=5LHnV4qjM_q6Hr4t&q=85&s=14c2665ce4ede87deedda14ad50833ea)](https://www.cometchat.com/docs)

Chat & Calling

Search...

Ctrl KAsk AI

- [Dashboard](https://app.cometchat.com/)
- [Contact Support](https://help.cometchat.com/hc/en-us/requests/new)
- [Contact Support](https://help.cometchat.com/hc/en-us/requests/new)

Search...

Navigation

Messaging

Typing Indicators

[Chat & Calling](https://www.cometchat.com/docs/chat-call) [Platform](https://www.cometchat.com/docs/fundamentals/overview) [Widget Builder](https://www.cometchat.com/docs/widget/html/overview) [UI Kit Builder](https://www.cometchat.com/docs/chat-builder/react/overview) [UI Kits](https://www.cometchat.com/docs/ui-kit/react/overview) [SDK](https://www.cometchat.com/docs/sdk/javascript/overview) [APIs](https://www.cometchat.com/docs/rest-api/chat-apis)

![https://mintlify.s3.us-west-1.amazonaws.com/cometchat-22654f5b/images/icons/js.svg](https://mintlify.s3.us-west-1.amazonaws.com/cometchat-22654f5b/images/icons/js.svg)

JavaScript

v4‎‎‎‎‎‎‎

- Overview

- Setup

- Authentication

- Messaging

  - [Overview](https://www.cometchat.com/docs/sdk/javascript/messaging-overview)
  - [Send A Message](https://www.cometchat.com/docs/sdk/javascript/send-message)
  - [Receive A Message](https://www.cometchat.com/docs/sdk/javascript/receive-message)
  - [Additional Message Filtering](https://www.cometchat.com/docs/sdk/javascript/additional-message-filtering)
  - [Retrieve Conversations](https://www.cometchat.com/docs/sdk/javascript/retrieve-conversations)
  - [Threaded Messages](https://www.cometchat.com/docs/sdk/javascript/threaded-messages)
  - [Edit A Message](https://www.cometchat.com/docs/sdk/javascript/edit-message)
  - [Delete A Message](https://www.cometchat.com/docs/sdk/javascript/delete-message)
  - [Delete A Conversation](https://www.cometchat.com/docs/sdk/javascript/delete-conversation)
  - [Typing Indicators](https://www.cometchat.com/docs/sdk/javascript/typing-indicators)
  - [Interactive Messages](https://www.cometchat.com/docs/sdk/javascript/interactive-messages)
  - [Transient Messages](https://www.cometchat.com/docs/sdk/javascript/transient-messages)
  - [Delivery & Read Receipts](https://www.cometchat.com/docs/sdk/javascript/delivery-read-receipts)
  - [Mentions](https://www.cometchat.com/docs/sdk/javascript/mentions)
  - [Reactions](https://www.cometchat.com/docs/sdk/javascript/reactions)
- Calling

- Users

- User Presence

- Groups

- [AI Moderation](https://www.cometchat.com/docs/sdk/javascript/ai-moderation)
- [AI Agents](https://www.cometchat.com/docs/sdk/javascript/ai-agents)
- Resources

- Advanced

- UI Kits

- [Extensions](https://www.cometchat.com/docs/fundamentals/extensions-overview)
- [AI](https://www.cometchat.com/docs/fundamentals/ai-user-copilot/overview)
- [Bots](https://www.cometchat.com/docs/ai-chatbots/overview)
- [Webhooks](https://www.cometchat.com/docs/fundamentals/webhooks-overview)
- [Changelog](https://github.com/cometchat/chat-sdk-javascript/releases)

On this page

- [Send a Typing Indicator](https://www.cometchat.com/docs/sdk/javascript/typing-indicators#send-a-typing-indicator)
- [Start Typing](https://www.cometchat.com/docs/sdk/javascript/typing-indicators#start-typing)
- [Stop Typing](https://www.cometchat.com/docs/sdk/javascript/typing-indicators#stop-typing)
- [Real-time Typing Indicators](https://www.cometchat.com/docs/sdk/javascript/typing-indicators#real-time-typing-indicators)

Messaging

# Typing Indicators

OpenAIOpen in ChatGPT

OpenAIOpen in ChatGPT

## [​](https://www.cometchat.com/docs/sdk/javascript/typing-indicators\#send-a-typing-indicator)  Send a Typing Indicator

_In other words, as a sender, how do I let the recipient(s) know that I’m typing?_

### [​](https://www.cometchat.com/docs/sdk/javascript/typing-indicators\#start-typing)  Start Typing

You can use the `startTyping()` method to inform the receiver that the logged in user has started typing. The receiver will receive this information in the `onTypingStarted()` method of the `MessageListener` class. In order to send the typing indicator, you need to use the `TypingIndicator` class.

- Start Typing (User)

- Start Typing (Group)

- Start User Typing (Typescript)

- Start Group Typing (Typescript)


Report incorrect code

Copy

Ask AI

```
let receiverId = "UID";
let receiverType = CometChat.RECEIVER_TYPE.USER;

let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType);
CometChat.startTyping(typingNotification);
```

### [​](https://www.cometchat.com/docs/sdk/javascript/typing-indicators\#stop-typing)  Stop Typing

You can use the `endTyping()` method to inform the receiver that the logged in user has stopped typing. The receiver will receive this information in the `onTypingEnded()` method of the `MessageListener` class. In order to send the typing indicator, you need to use the `TypingIndicator` class.

- Stop Typing (User)

- Stop Typing (Group)

- Stop User Typing (Typescript)

- Stop Group Typing (Typescript)


Report incorrect code

Copy

Ask AI

```
let receiverId = "UID";
let receiverType = CometChat.RECEIVER_TYPE.USER;

let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType);
CometChat.endTyping(typingNotification);
```

Custom DataYou can use the `metadata` field of the `TypingIndicator` class to pass additional data along with the typing indicators. The metadata field is a JSONObject and can be set using the `setMetadata()` method of the `TypingIndicator` class. This data will be received at the receiver end and can be obtained using the `getMetadata()` method.

## [​](https://www.cometchat.com/docs/sdk/javascript/typing-indicators\#real-time-typing-indicators)  Real-time Typing Indicators

_In other words, as a recipient, how do I know when someone is typing?_You will receive the typing indicators in the `onTypingStarted()` and the `onTypingEnded()` method of the registered `MessageListener` class.

- Message Listener

- TypeScript


Report incorrect code

Copy

Ask AI

```
let listenerId = "UNIQUE_LITENER_ID";

CometChat.addMessageListener(
listenerId,
new CometChat.MessageListener({
  onTypingStarted: typingIndicator => {
    console.log("Typing started :", typingIndicator);
  },
  onTypingEnded: typingIndicator => {
    console.log("Typing ended :", typingIndicator);
  }
})
);
```

The `TypingIndicator` class consists of the below parameters:

| Parameter | Information |
| --- | --- |
| **sender** | An object of the `User` class holding all the information. related to the sender of the typing indicator. |
| **receiverId** | Unique Id of the receiver. This can be the Id of the group or the user the typing indicator is sent to. |
| **receiverType** | This parameter indicates if the typing indicator is to be sent to a user or a group. The possible values are: 1. `CometChat.RECEIVER_TYPE.USER` 2\. `CometChat.RECEIVER_TYPE.GROUP` |
| **metadata** | A JSONObject to provider additional data. |

Was this page helpful?

YesNo

[Suggest edits](https://github.com/cometchat/docs/edit/main/sdk/javascript/typing-indicators.mdx) [Raise issue](https://github.com/cometchat/docs/issues/new?title=Issue%20on%20docs&body=Path:%20/sdk/javascript/typing-indicators)

[Delete A Conversation\\
\\
Previous](https://www.cometchat.com/docs/sdk/javascript/delete-conversation) [Interactive Messages\\
\\
Next](https://www.cometchat.com/docs/sdk/javascript/interactive-messages)

Ctrl+I

[linkedin](https://www.linkedin.com/company/cometchat/) [x](https://twitter.com/CometChat) [github](https://www.github.com/cometchat)

[Powered by Mintlify](https://www.mintlify.com/?utm_campaign=poweredBy&utm_medium=referral&utm_source=cometchat-22654f5b)

Assistant

Responses are generated using AI and may contain mistakes.

[Create support ticket](mailto:help@cometchat.com)