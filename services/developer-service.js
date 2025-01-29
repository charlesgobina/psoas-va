import { db } from "../config/admin-config.js";

class ApartmentService {
  static apartmentCollection = "apartments";

  static async saveApartment(id, apartmentData) {
    try {
      await db.collection(this.apartmentCollection).doc(id).set(apartmentData);
    } catch (e) {
      console.log(e)
    }
  }
}

export default ApartmentService