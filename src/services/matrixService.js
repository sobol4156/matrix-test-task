import * as sdk from "matrix-js-sdk";

let client;

if (typeof global === "undefined") {
  window.global = window;
}

/**
 * Logs in the user to the Matrix server using their username and password.
 *
 * @async
 * @function login
 * @param {string} server - The base URL of the Matrix server.
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<void>} Resolves when the user is successfully logged in.
 */
export async function login(server, username, password) {
  client = sdk.createClient({ baseUrl: server });
  const response = await client.loginRequest({
    type: "m.login.password",
    user: username,
    password,
  });

  localStorage.setItem("matrixToken", response.access_token);
  localStorage.setItem("matrixUserId", response.user_id);

  client.setAccessToken(response.access_token);
  client.credentials = client.credentials || {};
  client.credentials.userId = response.user_id;
  client.startClient();
}

/**
 * Retrieves the list of rooms the user is a member of.
 *
 * @async
 * @function getRooms
 * @returns {Promise<Array>} A list of room objects containing room ID, name, avatar URL, last event, and unread count.
 * @throws {Error} Throws an error if the client is not initialized or if token or user ID is missing.
 */
export async function getRooms() {
  const token = localStorage.getItem("matrixToken");
  const userId = localStorage.getItem("matrixUserId");

  if (!token || !userId) {
    console.error("Missing token or userId");
    return [];
  }

  if (!client) {
    client = sdk.createClient({
      baseUrl: "https://matrix.org",
      accessToken: token,
      userId: userId,
    });

    client.credentials = client.credentials || {};
    client.credentials.userId = userId;

    client.startClient();
  }

  await new Promise((resolve, reject) => {
    const syncHandler = (state) => {
      console.log("Matrix sync state:", state);
      if (state === "PREPARED" || state === "SYNCING") {
        client?.removeListener("sync", syncHandler);
        resolve();
      } else if (state === "ERROR") {
        reject(new Error("Matrix sync failed"));
      }
    };
    client?.once("sync", syncHandler);
  });

  const rooms = client.getRooms();

  return await Promise.all(
    rooms.map(async (room) => {
      const avatarEvent = room.currentState.getStateEvents("m.room.avatar", "");
      const mxcUrl = avatarEvent?.getContent()?.url;
      const avatarUrl = mxcUrl
        ? await fetch(
            client.mxcUrlToHttp(mxcUrl, 40, 40, "crop", false, true, true),
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ).then((res) => (res.ok ? res.url : null))
        : null;

      return {
        roomId: room.roomId,
        name: room.name || "Unnamed Room",
        avatarUrl,
        lastEvent:
          room.getLiveTimeline().getEvents().at(-1)?.getContent()?.body ||
          "No recent events",
        unreadCount: room.getUnreadNotificationCount("total"),
      };
    })
  );
}

/**
 * Retrieves the messages from a specified room.
 *
 * @async
 * @function getRoomMessages
 * @param {string} roomId - The ID of the room to get messages from.
 * @returns {Promise<Array>} A list of message objects containing message ID, sender, and content.
 * @throws {Error} Throws an error if the client is not initialized or the room is not found.
 */
export async function getRoomMessages(roomId) {
  if (!client) throw new Error("Client not initialized");

  const room = client.getRoom(roomId);
  if (!room) throw new Error("Room not found");

  const timeline = room.getLiveTimeline().getEvents();

  return timeline.map((event) => ({
    id: event.getId(),
    sender: event.getSender().split(":")[0].replace("@", ""),
    content: event.getContent().body || "",
  }));
}
