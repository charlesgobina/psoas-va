import { v4 as uuidv4 } from "uuid";

class ApartmentModel {
  constructor({
    apartmentId = uuidv4(),
    apartmentStatus = "",
    vacantFrom = "",
    gender = "",
    address = "",
    rooms = 0,
    sizeM2 = 0,
    rent = 0,
    floor = 0,
    placeForWashingMachine = false,
    placeForDishwasher = false,
    floorMaterial = "",
    bedroomWindow = "",
    livingRoomWindow = "",
    balcony = false,
    sauna = false,
    stove = "",
    fixedLampInRoom = false,
    information = "",
    reserveButton = "",
    asun = "",
    parentLocation = "",
    apartmentType = "",
    imageList = [],
    ownUrl = "",
    updatedAt = new Date().toISOString() // Automatically sets current timestamp
  } = {}) {
    this.apartmentId = apartmentId;
    this.apartmentStatus = apartmentStatus;
    this.vacantFrom = vacantFrom;
    this.gender = gender;
    this.address = address;
    this.rooms = rooms;
    this.sizeM2 = sizeM2;
    this.rent = rent;
    this.floor = floor;
    this.placeForWashingMachine = placeForWashingMachine;
    this.placeForDishwasher = placeForDishwasher;
    this.floorMaterial = floorMaterial;
    this.bedroomWindow = bedroomWindow;
    this.livingRoomWindow = livingRoomWindow;
    this.balcony = balcony;
    this.sauna = sauna;
    this.stove = stove;
    this.fixedLampInRoom = fixedLampInRoom;
    this.information = information;
    this.reserveButton = reserveButton;
    this.asun = asun;
    this.parentLocation = parentLocation;
    this.apartmentType = apartmentType;
    this.imageList = imageList;
    this.ownUrl = ownUrl;
    this.updatedAt = updatedAt;
  }

  // Method to update apartment details and set updatedAt timestamp
  updateDetails(updatedData) {
    Object.assign(this, updatedData);
    this.updatedAt = new Date().toISOString();
  }

  // Convert object to JSON string
  toJSON() {
    return {
      apartmentId: this.apartmentId,
      apartmentStatus: this.apartmentStatus,
      vacantFrom: this.vacantFrom,
      gender: this.gender,
      address: this.address,
      rooms: this.rooms,
      sizeM2: this.sizeM2,
      rent: this.rent,
      floor: this.floor,
      placeForWashingMachine: this.placeForWashingMachine,
      placeForDishwasher: this.placeForDishwasher,
      floorMaterial: this.floorMaterial,
      bedroomWindow: this.bedroomWindow,
      livingRoomWindow: this.livingRoomWindow,
      balcony: this.balcony,
      sauna: this.sauna,
      stove: this.stove,
      fixedLampInRoom: this.fixedLampInRoom,
      information: this.information,
      reserveButton: this.reserveButton,
      asun: this.asun,
      parentLocation: this.parentLocation,
      apartmentType: this.apartmentType,
      imageList: this.imageList,
      ownUrl: this.ownUrl,
      updatedAt: this.updatedAt
    };

    
  }

  // Create an Apartment object from a JSON string
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new Apartment(data);
    } catch (error) {
      console.error("Invalid JSON format:", error);
      return null;
    }
  }
}

export default ApartmentModel;

// Example Usage
// const sampleApartment = new Apartment({
//   apartmentStatus: "Available",
//   vacantFrom: "2025-03-01",
//   gender: "Any",
//   address: "123 Sample Street, Helsinki",
//   rooms: 2,
//   sizeM2: 45,
//   rent: 950,
//   floor: 3,
//   placeForWashingMachine: true,
//   placeForDishwasher: false,
//   floorMaterial: "Hardwood",
//   bedroomWindow: "East",
//   livingRoomWindow: "West",
//   balcony: true,
//   sauna: false,
//   stove: "Electric",
//   fixedLampInRoom: true,
//   information: "Great location near the city center.",
//   reserveButton: "https://example.com/reserve",
//   asun: "Apartment Complex A",
//   parentLocation: "Helsinki",
//   apartmentType: "Studio"
// });

// Convert to JSON
// const jsonString = sampleApartment.toJSON();
// console.log("JSON String:", jsonString);

// // Convert back to object
// const parsedApartment = Apartment.fromJSON(jsonString);
// console.log("Parsed Apartment Object:", parsedApartment);

// // Update details example
// sampleApartment.updateDetails({ rent: 1000, vacantFrom: "2025-04-01" });
// console.log("Updated Apartment:", sampleApartment);
