/**
 * useSoundEffects — lightweight SE system using expo-av
 *
 * Sounds:
 *   tap     — tile swap attempt
 *   match   — successful match / score
 *   combo   — cascade combo
 *   special — robot/pyramid activated
 *   clear   — stage cleared
 *   fail    — stage failed / time up
 *   acquire — character acquired
 *
 * Respects sfxEnabled from gameStore.
 */
import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useGameStore } from '../store/gameStore';

const SOUND_FILES = {
  tap:     require('../../assets/sounds/tap.wav'),
  match:   require('../../assets/sounds/score_up.wav'),
  combo:   require('../../assets/sounds/jump.wav'),
  special: require('../../assets/sounds/coin.wav'),
  clear:   require('../../assets/sounds/ring_success.wav'),
  fail:    require('../../assets/sounds/ring_fail.wav'),
  acquire: require('../../assets/sounds/evolve.wav'),
};

export function useSoundEffects() {
  const sfxEnabled  = useGameStore(s => s.sfxEnabled);
  const soundsRef   = useRef({});
  const loadedRef   = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const entries = await Promise.all(
          Object.entries(SOUND_FILES).map(async ([key, src]) => {
            const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false });
            return [key, sound];
          })
        );
        if (!cancelled) {
          soundsRef.current = Object.fromEntries(entries);
          loadedRef.current = true;
        }
      } catch (e) {
        // Gracefully ignore missing files or audio errors
      }
    };

    load();
    return () => {
      cancelled = true;
      Object.values(soundsRef.current).forEach(s => s?.unloadAsync?.());
      soundsRef.current = {};
      loadedRef.current = false;
    };
  }, []);

  const play = useCallback(async (name) => {
    if (!sfxEnabled || !loadedRef.current) return;
    const sound = soundsRef.current[name];
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (_) {}
  }, [sfxEnabled]);

  return { play };
}
