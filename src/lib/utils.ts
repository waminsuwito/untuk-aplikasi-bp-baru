

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function printElement(elementId: string) {
  const printContent = document.getElementById(elementId);
  if (!printContent) {
    console.error(`Element with id "${elementId}" not found.`);
    return;
  }
  window.print();
}


/**
 * Calculates the distance between two GPS coordinates in meters using the Haversine formula.
 * @param lat1 Latitude of the first point.
 * @param lon1 Longitude of the first point.
 * @param lat2 Latitude of the second point.
 * @param lon2 Longitude of the second point.
 * @returns The distance in meters.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}


/**
 * Plays a sound file from the public directory.
 * @param src The path to the sound file (e.g., '/notification.mp3').
 */
export function playSound(src: string): void {
  if (typeof window !== 'undefined') {
    const audio = new Audio(src);
    audio.play().catch(error => {
      // Autoplay was prevented. This is common and expected in modern browsers.
      // The user must interact with the page first.
      console.warn("Audio play was prevented. User interaction might be required.", error);
    });
  }
}
