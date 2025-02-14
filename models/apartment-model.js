import { v4 as uuidv4 } from "uuid";

class ApartmentModel {
  constructor({
    apartmentId = uuidv4(),
    totalVacantApartments,
    sharedApartments,
    familyApartments,
    studioApartments,
    addresses,
    link = "",
    date = new Date().toISOString().split("T")[0],
    time = Date.now()
  }) {
    this.apartmentId = apartmentId;
    this.totalVacantApartments = totalVacantApartments;
    this.sharedApartments = sharedApartments;
    this.familyApartments = familyApartments;
    this.studioApartments = studioApartments;
    this.addresses = addresses;
    this.link = link;
    this.date = date;
    this.time = time;
  }

  toJSON() {
    return {
      apartmentId: this.apartmentId,
      totalVacantApartments: this.totalVacantApartments,
      sharedApartments: this.sharedApartments,
      familyApartments: this.familyApartments,
      studioApartments: this.studioApartments,
      addresses: this.addresses,
      link: this.link,
      date: this.date,
      time: this.time,
    };
  }

  fromJSON(json) {
    this.apartmentId = json.apartmentId;
    this.totalVacantApartments = json.totalVacantApartments;
    this.sharedApartments = json.sharedApartments;
    this.familyApartments = json.familyApartments;
    this.studioApartments = json.studioApartments;
    this.addresses = json.addresses;
    this.link = json.link;
    this.date = json.date;
    this.time = json.time;
  }

}


export default ApartmentModel;