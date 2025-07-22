

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useAuth } from '@/context/auth-provider';
import type { Vehicle, Assignment, UserLocation, VehiclePosition } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const VEHICLES_STORAGE_KEY_PREFIX = 'app-vehicles-';
const ASSIGNMENTS_STORAGE_KEY_PREFIX = 'app-assignments-';
const VEHICLE_POSITIONS_KEY = 'app-vehicle-positions';

const containerStyle = {
  width: '100%',
  height: '75vh',
  borderRadius: '0.75rem',
};

// Center of Pekanbaru
const defaultCenter = {
  lat: 0.507067,
  lng: 101.447779,
};

// A more realistic 2D mixer truck icon as an inline SVG (green color)
const truckIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2322C55E" width="48px" height="48px">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M21.58 7.43L15.9 2.61C15.44 2.22 14.85 2 14.22 2H7.5c-1.1 0-2 .9-2 2v2.58c0 .24.08.47.21.66l4.22 6.34-3.64 3.64c-.38.38-.59.88-.59 1.41V20h2c0 1.1.9 2 2 2s2-.9 2-2h8c0 1.1.9 2 2 2s2-.9 2-2h2v-3.34c0-.53-.21-1.03-.59-1.41l-3.64-3.64 2.21-3.31c.14-.19.22-.43.22-.67V8.41c0-.53-.21-1.04-.58-1.42zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM7.5 4h6.72l4.63 3.86H7.5V4z"/>
  </svg>
`;

const getVehiclesForLocation = (location: UserLocation): Vehicle[] => {
  try {
    const key = `${VEHICLES_STORAGE_KEY_PREFIX}${location}`;
    const storedVehicles = localStorage.getItem(key);
    return storedVehicles ? JSON.parse(storedVehicles) : [];
  } catch (error) {
    return [];
  }
};

const getAssignments = (location: UserLocation): Assignment[] => {
  try {
    const key = `${ASSIGNMENTS_STORAGE_KEY_PREFIX}${location}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const getVehiclePositions = (): VehiclePosition[] => {
    try {
        const stored = localStorage.getItem(VEHICLE_POSITIONS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

const saveVehiclePositions = (positions: VehiclePosition[]) => {
    try {
        localStorage.setItem(VEHICLE_POSITIONS_KEY, JSON.stringify(positions));
    } catch (e) {
        console.error("Failed to save vehicle positions", e);
    }
}


export default function PetaKendaraanPage() {
  const { user } = useAuth();
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const truckIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
        url: `data:image/svg+xml;charset=UTF-8,${truckIconSvg}`,
        scaledSize: new window.google.maps.Size(30, 30),
        anchor: new window.google.maps.Point(15, 15),
    };
  }, [isLoaded]);

  const generateAndStorePositions = useCallback(() => {
    if (!user?.location) return;

    const vehicles = getVehiclesForLocation(user.location);
    const assignments = getAssignments(user.location);
    const existingPositions = getVehiclePositions();
    const existingPositionMap = new Map(existingPositions.map(p => [p.id, p]));

    const newPositions = vehicles.map(vehicle => {
      // If position already exists, use it.
      if (existingPositionMap.has(vehicle.id)) {
        // Update operator info just in case it changed
        const assignment = assignments.find(a => a.vehicleId === vehicle.id);
        const existingPosition = existingPositionMap.get(vehicle.id)!;
        existingPosition.operator = assignment?.username || 'Belum ada';
        return existingPosition;
      }

      // If not, generate a new random position around the center
      const assignment = assignments.find(a => a.vehicleId === vehicle.id);
      return {
        id: vehicle.id,
        nomorPolisi: vehicle.nomorPolisi,
        jenis: vehicle.jenisKendaraan,
        operator: assignment?.username || 'Belum ada',
        lat: defaultCenter.lat + (Math.random() - 0.5) * 0.1, // ~11km radius
        lng: defaultCenter.lng + (Math.random() - 0.5) * 0.1,
      };
    });
    
    setVehiclePositions(newPositions);
    saveVehiclePositions(newPositions);

  }, [user]);

  useEffect(() => {
    generateAndStorePositions();
    
    // Simulate position updates every 30 seconds
    const interval = setInterval(() => {
        setVehiclePositions(currentPositions => {
            const updatedPositions = currentPositions.map(p => ({
                ...p,
                lat: p.lat + (Math.random() - 0.5) * 0.001,
                lng: p.lng + (Math.random() - 0.5) * 0.001,
            }));
            saveVehiclePositions(updatedPositions);
            return updatedPositions;
        });
    }, 30000);

    return () => clearInterval(interval);

  }, [generateAndStorePositions]);

  const mapCenter = useMemo(() => {
    if (vehiclePositions.length > 0) {
      const avgLat = vehiclePositions.reduce((sum, p) => sum + p.lat, 0) / vehiclePositions.length;
      const avgLng = vehiclePositions.reduce((sum, p) => sum + p.lng, 0) / vehiclePositions.length;
      return { lat: avgLat, lng: avgLng };
    }
    return defaultCenter;
  }, [vehiclePositions]);


  if (loadError) {
    return (
        <Card>
            <CardHeader><CardTitle>Error Peta</CardTitle></CardHeader>
            <CardContent>
              <p>Gagal memuat Google Maps. Ini bisa disebabkan oleh:</p>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                <li>Kunci API Google Maps tidak valid atau tidak ada.</li>
                <li>API "Maps JavaScript API" belum diaktifkan di Google Cloud Console.</li>
                <li>Masalah penagihan (billing) pada akun Google Cloud Anda.</li>
              </ul>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" />
          Peta Posisi Kendaraan
        </CardTitle>
        <CardDescription>
          Lokasi terakhir dari semua kendaraan yang terdaftar. Posisi diperbarui secara berkala.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={12}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
          >
            {vehiclePositions.map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={{ lat: vehicle.lat, lng: vehicle.lng }}
                onClick={() => setSelectedVehicle(vehicle)}
                icon={truckIcon}
              />
            ))}

            {selectedVehicle && (
              <InfoWindow
                position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                onCloseClick={() => setSelectedVehicle(null)}
              >
                <div className="p-1 space-y-1 text-sm">
                  <h4 className="font-bold">{selectedVehicle.nomorPolisi}</h4>
                  <p>Jenis: {selectedVehicle.jenis}</p>
                  <p>Operator: {selectedVehicle.operator}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
            <div className="flex flex-col items-center justify-center h-[75vh] w-full bg-muted rounded-lg">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4"/>
                <p className="text-muted-foreground">Memuat peta...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
