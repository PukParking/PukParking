PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ADMINISTRATOR (
    Administrator_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Administrator_Username TEXT NOT NULL,
    Administrator_passwordHash TEXT NOT NULL,
    Administrator_Permissions TEXT
);


CREATE TABLE IF NOT EXISTS BUILDING (
    Building_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Administrator_ID INTEGER NOT NULL,
    Building_Name TEXT NOT NULL,
    Building_Abbreviation TEXT,
    Building_Description TEXT,
    Building_Latitude REAL,
    Building_Longitude REAL,

    FOREIGN KEY (Administrator_ID)
        REFERENCES ADMINISTRATOR(Administrator_ID)
);


CREATE TABLE IF NOT EXISTS PARKING_AREA (
    Parking_Area_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Administrator_ID INTEGER NOT NULL,
    Parking_Area_Name TEXT NOT NULL,
    Parking_Area_Latitude REAL,
    Parking_Area_Longitude REAL,
    Parking_Type TEXT,
    Parking_Area_Capacity INTEGER,
    Parking_Area_Occupied_Spaces INTEGER,
    Parking_Area_Restrictions TEXT,
    Parking_Area_Operating_Hours TEXT,
    Parking_Area_Accessible_Spaces INTEGER,
    Parking_Area_Image_URL TEXT,
    Parking_Area_isActive INTEGER,

    FOREIGN KEY (Administrator_ID)
        REFERENCES ADMINISTRATOR(Administrator_ID)
);


CREATE TABLE IF NOT EXISTS PARKING_FULL_REPORT (
    Report_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Parking_Area_ID INTEGER NOT NULL,
    Report_Submitted_Time TEXT,
    Report_Expiry_Time TEXT,

    FOREIGN KEY (Parking_Area_ID)
        REFERENCES PARKING_AREA(Parking_Area_ID)
);