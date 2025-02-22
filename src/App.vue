<script setup lang="ts">
import { ref } from 'vue';
import LoginForm from './components/LoginForm.vue';
import RoomList from './components/RoomList.vue';

const isAuthenticated = ref(localStorage.getItem('matrixToken') !== null);

const handleLoginSuccess = () => {
    isAuthenticated.value = true;
};
</script>

<template>
    <div id="app">
        <LoginForm v-if="!isAuthenticated" @login-success="handleLoginSuccess" />
        <RoomList v-else />
    </div>
</template>
