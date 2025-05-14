
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://shopsphere_user:abcdefghijklmnopqrstuvwxyz@cluster0.jlzp7sf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["shopsphere"]
products_col = db["products"]
