<script setup>
import { ref, defineEmits } from 'vue';
import { login } from '../services/matrixService';

const server = ref('https://matrix.org');
const username = ref('');
const password = ref('');
const emit = defineEmits(['login-success']);

const submitLogin = async () => {
    try {
        await login(server.value, username.value, password.value);
        emit('login-success');
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
};
</script>

<template>
    <div class="login-form-container">
        <form @submit.prevent="submitLogin" class="login-form">
            <h1 class="title">Login</h1>
            <input v-model="server" placeholder="Home Server URL" class="input" />
            <input v-model="username" placeholder="Username" class="input" />
            <input v-model="password" type="password" placeholder="Password" class="input" />
            <button type="submit" class="button">Login</button>
        </form>
    </div>
</template>

<style scoped>
.login-form-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #181818;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 20px;
    width: 400px;
    background-color: #252525;
    border-radius: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.title {
    text-align: center;
    font-size: 2em;
    color: #ffffff;
    margin-bottom: 20px;
}

.input {
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #333333;
    background-color: #181818;
    color: #ffffff;
    font-size: 16px;
}

.button {
    padding: 10px;
    border: none;
    border-radius: 5px;
    background-color: #00bfff;
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.button:hover {
    background-color: #009acd;
}
</style>
