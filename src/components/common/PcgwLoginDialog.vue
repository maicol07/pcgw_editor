<script setup lang="ts">
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import { useToast } from 'primevue/usetoast';
import { LogIn, ShieldAlert } from 'lucide-vue-next';
import { pcgwAuth } from '../../services/pcgwAuth';

const props = defineProps<{
    visible: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'login-success'): void;
}>();

const toast = useToast();
const username = ref(pcgwAuth.username);
const password = ref(pcgwAuth.password);
const isLoading = ref(false);
const error = ref('');

const handleLogin = async () => {
    if (!username.value || !password.value) {
        error.value = 'Username and Bot Password are required.';
        return;
    }

    isLoading.value = true;
    error.value = '';
    
    try {
        const success = await pcgwAuth.login(username.value, password.value);
        if (success) {
            toast.add({
                severity: 'success',
                summary: 'Logged In',
                detail: `Successfully authenticated as ${username.value}`,
                life: 3000
            });
            emit('login-success');
            emit('update:visible', false);
        } else {
            error.value = 'Login failed. Please check your credentials.';
        }
    } catch (e) {
        error.value = 'An unexpected error occurred during login.';
    } finally {
        isLoading.value = false;
    }
};

const openBotPasswordHelp = () => {
    window.open('https://www.pcgamingwiki.com/wiki/Special:BotPasswords', '_blank');
};
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)"
        modal 
        header="Login to PCGamingWiki" 
        class="w-full max-w-md mx-4"
        :draggable="false"
    >
        <div class="flex flex-col gap-4 py-2">
            <Message severity="info" class="text-xs!">
                <template #icon>
                    <ShieldAlert class="w-4 h-4 mr-2" />
                </template>
                It is highly recommended to use a 
                <a @click="openBotPasswordHelp" class="underline cursor-pointer font-bold">Bot Password</a>
                instead of your main account password for extra security.
                
                <div class="mt-2 flex flex-col gap-1">
                    <p class="font-bold text-[10px] uppercase">Required Permissions:</p>
                    <ul class="list-disc list-inside text-[10px] opacity-80">
                        <li>Edit existing pages</li>
                        <li>Create, edit, and move pages</li>
                        <li>Upload new files</li>
                        <li>Upload, replace, and move files</li>
                    </ul>
                </div>
            </Message>

            <div class="flex flex-col gap-1.5">
                <label for="username" class="text-xs font-bold text-surface-500 uppercase tracking-wider">Username</label>
                <InputText 
                    id="username" 
                    v-model="username" 
                    placeholder="Username" 
                    fluid
                    :disabled="isLoading"
                    @keyup.enter="handleLogin"
                />
            </div>

            <div class="flex flex-col gap-1.5">
                <label for="password" class="text-xs font-bold text-surface-500 uppercase tracking-wider">Bot Password</label>
                <Password 
                    id="password" 
                    v-model="password" 
                    placeholder="Bot Password" 
                    fluid
                    :toggleMask="true"
                    :feedback="false"
                    :disabled="isLoading"
                    @keyup.enter="handleLogin"
                />
            </div>

            <Message v-if="error" severity="error" class="text-xs! mt-2">
                {{ error }}
            </Message>

            <div class="flex gap-2 mt-4">
                <Button 
                    label="Cancel" 
                    severity="secondary" 
                    text 
                    class="flex-1"
                    @click="emit('update:visible', false)"
                    :disabled="isLoading"
                />
                <Button 
                    label="Login" 
                    severity="primary" 
                    class="flex-1"
                    :loading="isLoading"
                    @click="handleLogin"
                >
                    <template #icon>
                        <LogIn class="w-4 h-4 mr-2" />
                    </template>
                </Button>
            </div>
        </div>

        <template #footer>
            <div class="text-[10px] text-center text-surface-400 dark:text-surface-500 mt-2">
                This app usually does not store your password. If "Automatic Session Refresh" is enabled in settings, your bot password will be stored locally to renew the session.
            </div>
        </template>
    </Dialog>
</template>
