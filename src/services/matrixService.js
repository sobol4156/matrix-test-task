import * as sdk from "matrix-js-sdk";

let client;

if (typeof global === "undefined") {
  window.global = window;
}

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
        const avatarEvent = room.currentState.getStateEvents('m.room.avatar', '');
        const mxcUrl = avatarEvent?.getContent()?.url;
        const avatarUrl = mxcUrl
        ? await fetch(client.mxcUrlToHttp(mxcUrl, 40, 40, 'crop', false, true, true), {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          }).then((res) => (res.ok ? res.url : null))
        : null;

        return {
            roomId: room.roomId,
            name: room.name || 'Unnamed Room',
            avatarUrl,
            lastEvent: room.getLiveTimeline().getEvents().at(-1)?.getContent()?.body || 'No recent events',
            unreadCount: room.getUnreadNotificationCount('total'),
        };
    })
);
}

export async function getRoomMessages(roomId) {
  if (!client) throw new Error('Client not initialized');

  const room = client.getRoom(roomId);
  if (!room) throw new Error('Room not found');

  const timeline = room.getLiveTimeline().getEvents();

  return timeline.map((event) => ({
      id: event.getId(),
      sender: event.getSender().split(':')[0].replace('@', ''),
      content: event.getContent().body || '',
  }));
}
