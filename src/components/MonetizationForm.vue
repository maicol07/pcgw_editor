<script setup lang="ts">
import { GameMonetization, GameMicrotransactions } from '../models/GameData';
import InputText from 'primevue/inputtext';
import { DollarSign, ShoppingCart } from 'lucide-vue-next';

defineProps<{
  monetization: GameMonetization;
  microtransactions: GameMicrotransactions;
}>();
</script>

<template>
  <div class="flex flex-col gap-10">
    <!-- Monetization Section -->
    <div class="flex flex-col gap-6">
        <div class="flex items-center gap-3 border-b border-surface-200 dark:border-surface-700 pb-2">
            <DollarSign class="text-primary-500 font-bold w-4 h-4" />
            <h3 class="text-base font-bold uppercase text-surface-700 dark:text-surface-200 tracking-wider">Monetization</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">One-time Game Purchase</label>
                <InputText v-model="monetization.oneTimePurchase" class="w-full text-sm" placeholder="Upfront purchase to access game" />
                <span class="text-[11px] text-surface-500 leading-tight">Requires upfront purchase to access.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Free-to-play</label>
                <InputText v-model="monetization.freeToPlay" class="w-full text-sm" placeholder="Significant portion accessible for free" />
                <span class="text-[11px] text-surface-500 leading-tight">Access significant portion without paying.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Freeware</label>
                <InputText v-model="monetization.freeware" class="w-full text-sm" placeholder="Completely free to own" />
                <span class="text-[11px] text-surface-500 leading-tight">Completely free in its entirety.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Ad-supported</label>
                <InputText v-model="monetization.adSupported" class="w-full text-sm" placeholder="Monetized through advertisements" />
                <span class="text-[11px] text-surface-500 leading-tight">Ads that are not part of gameplay.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Subscription</label>
                <InputText v-model="monetization.subscription" class="w-full text-sm" placeholder="Requires continuous payment" />
                <span class="text-[11px] text-surface-500 leading-tight">Game-specific periodic payment.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Subscription Gaming Service</label>
                <InputText v-model="monetization.subscriptionGamingService" class="w-full text-sm" placeholder="Included in Game Pass, EA Play, etc." />
                <span class="text-[11px] text-surface-500 leading-tight">Part of a collection/service (Game Pass).</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">DLC</label>
                <InputText v-model="monetization.dlc" class="w-full text-sm" placeholder="Medium chunks of additional content" />
                <span class="text-[11px] text-surface-500 leading-tight">Additional maps, levels, quests.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Expansion Pack</label>
                <InputText v-model="monetization.expansionPack" class="w-full text-sm" placeholder="Substantially expands playtime" />
                <span class="text-[11px] text-surface-500 leading-tight">Large campaigns, significant new content.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Cross-game Bonus</label>
                <InputText v-model="monetization.crossGameBonus" class="w-full text-sm" placeholder="Unlocked by owning other games" />
                <span class="text-[11px] text-surface-500 leading-tight">Bonuses for owning/playing other games.</span>
            </div>
        </div>
    </div>

    <!-- Microtransactions Section -->
    <div class="flex flex-col gap-6">
        <div class="flex items-center gap-3 border-b border-surface-200 dark:border-surface-700 pb-2">
            <ShoppingCart class="text-primary-500 font-bold w-4 h-4" />
            <h3 class="text-base font-bold uppercase text-surface-700 dark:text-surface-200 tracking-wider">Microtransactions</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">None</label>
                <InputText v-model="microtransactions.none" class="w-full text-sm" placeholder="The game does not contain microtransactions." />
                <span class="text-[11px] text-surface-500 leading-tight">Standard: No microtransactions present.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Cosmetic</label>
                <InputText v-model="microtransactions.cosmetic" class="w-full text-sm" placeholder="Skins, hats, decorative items" />
                <span class="text-[11px] text-surface-500 leading-tight">Items that don't affect gameplay.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Currency</label>
                <InputText v-model="microtransactions.currency" class="w-full text-sm" placeholder="Virtual currency (Gems, V-Bucks)" />
                <span class="text-[11px] text-surface-500 leading-tight">Bought with real money.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Loot Box</label>
                <InputText v-model="microtransactions.lootBox" class="w-full text-sm" placeholder="Random items, chance-based rewards" />
                <span class="text-[11px] text-surface-500 leading-tight">Randomized purchase for items.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Unlock</label>
                <InputText v-model="microtransactions.unlock" class="w-full text-sm" placeholder="Locked content, characters, levels" />
                <span class="text-[11px] text-surface-500 leading-tight">Content that affects gameplay.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Boost</label>
                <InputText v-model="microtransactions.boost" class="w-full text-sm" placeholder="Accelerate progress (XP, Gold)" />
                <span class="text-[11px] text-surface-500 leading-tight">Accelerate speed, levelling, or skips.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Free-to-grind</label>
                <InputText v-model="microtransactions.freeToGrind" class="w-full text-sm" placeholder="Unlocks achievable via gameplay" />
                <span class="text-[11px] text-surface-500 leading-tight">Can unlock everything by playing.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Finite Spend</label>
                <InputText v-model="microtransactions.finiteSpend" class="w-full text-sm" placeholder="Limit on total possible purchases" />
                <span class="text-[11px] text-surface-500 leading-tight">Fixed number of items to buy.</span>
            </div>
             <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Infinite Spend</label>
                <InputText v-model="microtransactions.infiniteSpend" class="w-full text-sm" placeholder="No limit on purchases (Shark Cards)" />
                <span class="text-[11px] text-surface-500 leading-tight">Can be bought over and over.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Player Trading</label>
                <InputText v-model="microtransactions.playerTrading" class="w-full text-sm" placeholder="Trading items via marketplace" />
                <span class="text-[11px] text-surface-500 leading-tight">Trading items/currency between players.</span>
            </div>
            <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-surface-700 dark:text-surface-200">Time-limited</label>
                <InputText v-model="microtransactions.timeLimited" class="w-full text-sm" placeholder="Limited promotions, pre-order bonuses" />
                <span class="text-[11px] text-surface-500 leading-tight">Exclusive to a specific time/promo.</span>
            </div>
        </div>
    </div>
  </div>
</template>


