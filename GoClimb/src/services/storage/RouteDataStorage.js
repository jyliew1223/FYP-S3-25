// GoClimb/src/services/storage/RouteDataStorage.js
import RNFS from 'react-native-fs';
import { LOCAL_DIR } from '../../constants/folder_path';

const ROUTE_DATA_FILE = `${LOCAL_DIR.BASE_DIR}/route_data.json`;

export class RouteDataStorage {
  // Ensure the base directory exists
  static async ensureBaseDirectory() {
    try {
      const baseExists = await RNFS.exists(LOCAL_DIR.BASE_DIR);
      if (!baseExists) {
        await RNFS.mkdir(LOCAL_DIR.BASE_DIR);
      }
    } catch (error) {
      console.error('[RouteDataStorage] Error creating base directory:', error);
    }
  }

  // Save route data locally
  static async saveRouteData(routeData) {
    try {
      await this.ensureBaseDirectory();
      
      const existingData = await this.getAllRouteData();
      const newEntry = {
        id: Date.now().toString(), // Simple ID based on timestamp
        timestamp: new Date().toISOString(),
        uploaded: false,
        ...routeData,
      };
      
      const updatedData = [...existingData, newEntry];
      await RNFS.writeFile(ROUTE_DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf8');
      
      console.log('[RouteDataStorage] Saved route data:', newEntry.id);
      return newEntry;
    } catch (error) {
      console.error('[RouteDataStorage] Error saving route data:', error);
      throw error;
    }
  }

  // Get all stored route data
  static async getAllRouteData() {
    try {
      const exists = await RNFS.exists(ROUTE_DATA_FILE);
      if (!exists) {
        return [];
      }
      
      const data = await RNFS.readFile(ROUTE_DATA_FILE, 'utf8');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[RouteDataStorage] Error getting route data:', error);
      return [];
    }
  }

  // Mark route data as uploaded
  static async markAsUploaded(id, additionalData = {}) {
    try {
      const allData = await this.getAllRouteData();
      const updatedData = allData.map(item => 
        item.id === id 
          ? { ...item, ...additionalData, uploaded: true, uploadedAt: new Date().toISOString() } 
          : item
      );
      
      await RNFS.writeFile(ROUTE_DATA_FILE, JSON.stringify(updatedData, null, 2), 'utf8');
      console.log('[RouteDataStorage] Marked as uploaded:', id, 'with additional data:', additionalData);
    } catch (error) {
      console.error('[RouteDataStorage] Error marking as uploaded:', error);
      throw error;
    }
  }

  // Delete route data
  static async deleteRouteData(id) {
    try {
      const allData = await this.getAllRouteData();
      const filteredData = allData.filter(item => item.id !== id);
      
      await RNFS.writeFile(ROUTE_DATA_FILE, JSON.stringify(filteredData, null, 2), 'utf8');
      console.log('[RouteDataStorage] Deleted route data:', id);
    } catch (error) {
      console.error('[RouteDataStorage] Error deleting route data:', error);
      throw error;
    }
  }

  // Clear all route data
  static async clearAllRouteData() {
    try {
      const exists = await RNFS.exists(ROUTE_DATA_FILE);
      if (exists) {
        await RNFS.unlink(ROUTE_DATA_FILE);
      }
      console.log('[RouteDataStorage] Cleared all route data');
    } catch (error) {
      console.error('[RouteDataStorage] Error clearing route data:', error);
      throw error;
    }
  }
}