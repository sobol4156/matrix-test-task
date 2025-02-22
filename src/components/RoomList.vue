<script setup>
import { ref, onMounted, computed } from 'vue';
import { getRooms, getRoomMessages } from '../services/matrixService';

const rooms = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedRoom = ref(null);
const messages = ref([]);
const sortOption = ref('lastEvent');

onMounted(async () => {
    try {
        rooms.value = await getRooms();
        console.log(rooms.value);
    } catch (err) {
        error.value = err.message || 'Failed to load rooms';
    } finally {
        loading.value = false;
    }
});

async function openRoom(roomId) {
    try {
        selectedRoom.value = rooms.value.find((room) => room.roomId === roomId);
        messages.value = await getRoomMessages(roomId);
    } catch (err) {
        console.error('Failed to load messages:', err);
    }
}


const sortedRooms = computed(() => {
    return [...rooms.value].sort((a, b) => {
        if (sortOption.value === 'lastEvent') {
          return new Date(a.lastEventTime) - new Date(b.lastEventTime)
        } else if (sortOption.value === 'alphabetical') {
            return b.name.localeCompare(a.name);
        }
    }).reverse();
});
</script>

<template>
  <div class="room-list" v-if="!selectedRoom">
      <h1 class="title">Chat Rooms</h1>
      <div class="sort-options">
          <label>
              Sort by:
              <select v-model="sortOption">
                  <option value="lastEvent">Last Event</option>
                  <option value="alphabetical">Alphabetical</option>
              </select>
          </label>
      </div>
      <div v-if="loading" class="loading">Loading rooms...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <ul v-else class="room-cards">
          <li v-for="room in sortedRooms" :key="room.roomId" class="room-card" @click="openRoom(room.roomId)">
              <div class="room-avatar">
                  <img v-if="room.avatarUrl" :src="room.avatarUrl" alt="avatar" />
              </div>
              <div class="room-info">
                  <h2>{{ room.name }}</h2>
                  <p>{{ room.lastEvent }}</p>
                  <span class="unread">Unread: {{ room.unreadCount }}</span>
              </div>
          </li>
      </ul>
  </div>

  <div class="chat-room" v-else>
      <h1 class="title">{{ selectedRoom.name }}</h1>
      <button @click="selectedRoom = null" class="back-button">← Back to rooms</button>
      <div class="messages">
          <div v-for="msg in messages" :key="msg.id" class="message">
              <strong>{{ msg.sender }}</strong>: {{ msg.content }}
          </div>
      </div>
  </div>
</template>

<style scoped>
.room-list, .chat-room {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    background-color: #181818;
    color: #ffffff;
    border-radius: 15px;
}

.title {
    text-align: center;
    font-size: 2em;
    color: #ffffff;
    margin-bottom: 20px;
}

.sort-options {
    text-align: center;
    margin-bottom: 15px;
}

.sort-options select {
    padding: 5px;
    border-radius: 5px;
    border: 1px solid #333333;
    background-color: #252525;
    color: #ffffff;
}

.loading, .error {
    text-align: center;
    font-size: 1.2em;
    color: #cccccc;
}

.room-cards {
    list-style: none;
    padding: 0;
}

.room-card {
    display: flex;
    align-items: center;
    border: 1px solid #333333;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    background-color: #252525;
    transition: background-color 0.3s;
    cursor: pointer;
}

.room-card:hover {
    background-color: #333333;
}

.room-avatar img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
}

.room-info {
    margin-left: 15px;
}

.room-info h2 {
    margin: 0;
    font-size: 18px;
    color: #ffffff;
}

.room-info p {
    margin: 5px 0;
    color: #cccccc;
}

.unread {
    font-weight: bold;
    color: #00bfff;
}

.chat-room .messages {
    border: 1px solid #333333;
    border-radius: 10px;
    padding: 10px;
    height: 400px;
    overflow-y: auto;
    background-color: #252525;
}

.message {
    margin-bottom: 8px;
}

.back-button {
    background: none;
    border: none;
    color: #00bfff;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 10px;
}

.back-button:hover {
    text-decoration: underline;
}
</style>
