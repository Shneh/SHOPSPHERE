from pymongo import MongoClient
from bson.objectid import ObjectId  # Import ObjectId for unique IDs

MONGO_URI = "mongodb+srv://shopsphere_user:abcdefghijklmnopqrstuvwxyz@cluster0.jlzp7sf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["shopsphere"]
products_col = db["products"]

# Fixed product list with unique _id values and corrected syntax
products = [
    {
        "name": "Capsicum-Green",
        "category": "Grocery",
        "price": 80,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000067_26-fresho-capsicum-green.jpg?tr=w-154,q-80"
    },
    {
        "name": "Carrot-Orange",
        "category": "Grocery",
        "price": 38,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000070_16-fresho-carrot-orange.jpg?tr=w-154,q-80"
    },
    {
        "name": "Cauliflower",
        "category": "Grocery",
        "price": 37.6,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000074_20-fresho-cauliflower.jpg?tr=w-154,q-80"
    },
    {
        "name": "Coriander-Leaves",
        "category": "Grocery",
        "price": 138.4,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000326_16-fresho-coriander-leaves.jpg?tr=w-154,q-80"
    },
    {
        "name": "Apple",
        "category": "Grocery",
        "price": 280,
        "image": "https://www.bbassets.com/media/uploads/p/m/40119549_1-fresho-apple-washington-113-count.jpg?tr=w-154,q-80"
    },
    # Add more products here with unique _id values and corrected syntax
    {
        "name": "Gift Box-Kiwi-Green",
        "category": "Grocery",
        "price": 200,
        "image": "https://www.bbassets.com/media/uploads/p/m/40117271_2-fresho-gift-box-kiwi-jumbo-green.jpg?tr=w-154,q-80"
    },
    {
        "name": "Pear",
        "category": "Grocery",
        "price": 250,
        "image": "https://www.bbassets.com/media/uploads/p/m/40084102_2-fresho-indian-pear-premium-institutional.jpg?tr=w-154,q-80"
    },
    {
        "name": "Guava",
        "category": "Grocery",
        "price": 95.89,
        "image": "https://www.bbassets.com/media/uploads/p/m/40189531_4-fresho-guava-thai.jpg?tr=w-154,q-80"
    },
    {
        "name": "Apricot-Dried",
        "category": "Grocery",
        "price": 327,
        "image": "https://www.bbassets.com/media/uploads/p/m/20001095_16-fresho-apricot-dried.jpg?tr=w-154,q-80"
    },
    {
        "name": "Sugarcane",
        "category": "Grocery",
        "price": 24.8,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000592_11-fresho-sugarcane.jpg?tr=w-154,q-80"
    },
    {
        "name": "Papaya",
        "category": "Grocery",
        "price": 50,
        "image": "https://www.bbassets.com/media/uploads/p/m/40296057_4-fresho-papaya.jpg?tr=w-154,q-80"
    },
    {
        "name": "Banana",
        "category": "Grocery",
        "price": 60,
        "image": "https://www.bbassets.com/media/uploads/p/m/60000054_9-fresho-banana-poovan.jpg?tr=w-154,q-80"
    },
    {
        "name": "Mango",
        "category": "Grocery",
        "price": 100,
        "image": "https://www.bbassets.com/media/uploads/p/m/50000449_6-fresho-mango-alphonso-ratnagiri-organic.jpg?tr=w-154,q-80"
    },
    {
        "name": "Pineapple",
        "category": "Grocery",
        "price": 220,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000156_30-fresho-pineapple.jpg?tr=w-154,q-80"
    },
    {
        "name": "Musk Melon",
        "category": "Grocery",
        "price": 80,
        "image": "https://www.bbassets.com/media/uploads/p/m/40073733_11-fresho-muskmelon-honeydew.jpg?tr=w-154,q-80"
    },
    {
        "name": "Coconut-Diced",
        "category": "Grocery",
        "price": 300,
        "image": "https://www.bbassets.com/media/uploads/p/m/40019379_6-fresho-coconut-diced.jpg?tr=w-154,q-80"
    },
    {
        "name": "Grapes",
        "category": "Grocery",
        "price": 150,
        "image": "https://www.bbassets.com/media/uploads/p/m/40019776_5-fresho-grapes-red-globe-indian.jpg?tr=w-154,q-80"
    },
    {
        "name": "Orange",
        "category": "Grocery",
        "price": 180,
        "image": "https://www.bbassets.com/media/uploads/p/m/40104708_2-fresho-orange-nagpur-premium.jpg?tr=w-154,q-80"
    },
    {
        "name": "Watermelon",
        "category": "Grocery",
        "price": 125,
        "image": "https://www.bbassets.com/media/uploads/p/m/40212282_3-fresho-watermelon-striped.jpg?tr=w-154,q-80"
    },
    {
        "name": "Chia Seed",
        "category": "Grocery",
        "price": 240.6,
        "image": "https://www.bbassets.com/media/uploads/p/m/40248893_1-homefills-chia-seed-whole-superfood-rich-in-omega-3-fatty-acids-antioxidants.jpg?tr=w-154,q-80"
    },
    {
        "name": "Organic Poha/Avalakki",
        "category": "Grocery",
        "price": 95,
        "image": "https://www.bbassets.com/media/uploads/p/m/40204007_1-earthon-organic-pohaavalakki.jpg?tr=w-154,q-80"
    },
    {
        "name": "Basmati Rice",
        "category": "Grocery",
        "price": 979.02,
        "image": "https://www.bbassets.com/media/uploads/p/m/40262616_1-roop-mahal-extra-premium-long-grain-basmati-rice-pure-authentic-taste.jpg?tr=w-154,q-80"
    },
    {
        "name": "Soya Chunks",
        "category": "Grocery",
        "price": 68,
        "image": "https://www.bbassets.com/media/uploads/p/m/40224407_1-teju-soya-chunks.jpg?tr=w-154,q-80"
    },
    {
        "name": "Kashmiri Rajma",
        "category": "Grocery",
        "price": 241,
        "image": "https://www.bbassets.com/media/uploads/p/m/40291266_1-brijrani-kashmiri-rajmah-100-pure-premium-quality-no-added-preservatives.jpg?tr=w-154,q-80"
    },
    {
        "name": "Urad Whole Regular",
        "category": "Grocery",
        "price": 169.2,
        "image": "https://www.bbassets.com/media/uploads/p/m/40133896_1-institutional-urad-whole-regular.jpg?tr=w-154,q-80"
    },
    {
        "name": "Moong Dal",
        "category": "Grocery",
        "price": 159.8,
        "image": "https://www.bbassets.com/media/uploads/p/m/40133880_1-institutional-moong-dal-regular.jpg?tr=w-154,q-80"
    },
    {
        "name": "Toor Dal/Togari Bele Unpolished",
        "category": "Grocery",
        "price": 75,
        "image": "https://www.bbassets.com/media/uploads/p/m/60000718_3-bb-royal-toor-dal-unpolished.jpg?tr=w-154,q-80"
    },
    {
        "name": "Sunflower Seeds",
        "category": "Grocery",
        "price": 120,
        "image": "https://www.bbassets.com/media/uploads/p/m/40160384_1-madilu-sunflower-seeds.jpg?tr=w-154,q-80"
    },
    {
        "name": "Kasturi Methi",
        "category": "Grocery",
        "price": 45,
        "image": "https://www.bbassets.com/media/uploads/p/m/40287480_1-aplus-kasuri-methi-strong-flavour-packed-with-nutrients-boosts-overall-health.jpg?tr=w-154,q-80"
    },
    {
        "name": "Cow Ghee",
        "category": "Grocery",
        "price": 621.01,
        "image": "https://www.bbassets.com/media/uploads/p/m/40268426_2-heritage-cow-ghee-rich-in-vitamins-minerals-healthy-taste.jpg?tr=w-154,q-80"
    },
    {
        "name": "Olive Pomace Oil",
        "category": "Grocery",
        "price": 777.42,
        "image": "https://www.bbassets.com/media/uploads/p/m/187262_4-leonardo-olive-pomace-oil.jpg?tr=w-154,q-80"
    },
    {
        "name": "Flaxseed Oil-Cold Pressed",
        "category": "Grocery",
        "price": 595,
        "image": "https://www.bbassets.com/media/uploads/p/m/40045325_8-health-1st-flaxseed-oil-cold-pressed.jpg?tr=w-154,q-80"
    },
    {
        "name": "Rice Bran Oil",
        "category": "Grocery",
        "price": 799.7,
        "image": "https://www.bbassets.com/media/uploads/p/m/70001440_9-oleev-rice-bran-oil-rich-in-oryzanol-vitamin-e.jpg?tr=w-154,q-80"
    },
    {
        "name": "Kachi Ghani Mustard Oil",
        "category": "Grocery",
        "price": 160,
        "image": "https://www.bbassets.com/media/uploads/p/m/40246587_1-ace-gold-kachi-ghani-mustard-oil-loaded-with-vitamins-minerals-rich-in-omega-3-fatty-acid.jpg?tr=w-154,q-80"
    },
    {
        "name": "Vanish All In One Liquid Detergent, 400ml+",
        "category": "Grocery",
        "price": 337.35,
        "image": "https://www.bbassets.com/media/uploads/p/m/1224246_3-bb-combo-vanish-all-in-one-liquid-detergent400ml-harpic-toilet-cleaneroriginal-1l.jpg?tr=w-154,q-80"
    },{
        "name": "Bell Pepper",
        "category": "Grocery",
        "price": 100,
        "image": "https://www.bbassets.com/media/uploads/p/m/40287310_4-fresho-coloured-capsicum-mix.jpg?tr=w-154,q-80"
    },
    {
        "name": "Spinach",
        "category": "Grocery",
        "price": 60,
        "image": "https://www.bbassets.com/media/uploads/p/m/10000187_14-fresho-palak-cleaned-without-roots.jpg?tr=w-154,q-80"
    },
    {
        "name": "Himalayan Rock Salt Crystals",
        "category": "Grocery",
        "price": 80,
        "image": "https://www.bbassets.com/media/uploads/p/m/40234977_1-shrutis-himalayan-rock-salt-crystals-100-natural-rich-in-minerals-chemical-free.jpg?tr=w-154,q-80"
    },
    {
        "name": "Jaggery/Gur",
        "category": "Grocery",
        "price": 89.1,
        "image": "https://www.bbassets.com/media/uploads/p/m/40236482_3-dhampur-green-jaggerygur-alternative-to-sugar-rich-in-minerals.jpg?tr=w-154,q-80"
    },
    {
        "name": "Brown Sugar",
        "category": "Grocery",
        "price": 98,
        "image": "https://www.bbassets.com/media/uploads/p/m/40287983_1-atri-foods-brown-raw-sugar-khandsari.jpg?tr=w-154,q-80"
    },
    {
        "name": "Salt",
        "category": "Grocery",
        "price": 280,
        "image": "https://www.bbassets.com/media/uploads/p/m/40335727_1-tata-salt-salt-vacuum-evaporated-iodised.jpg?tr=w-154,q-80"
    },
    {
        "name": "Apple",
        "category": "Grocery",
        "price": 280,
        "image": "https://www.bbassets.com/media/uploads/p/m/40119549_1-fresho-apple-washington-113-count.jpg?tr=w-154,q-80"
    },
    {
        "name": "French Fries",
        "category": "Grocery",
        "price": 314,
        "image": "https://www.bbassets.com/media/uploads/p/m/40016990_3-mccain-french-fries.jpg?tr=w-154,q-80"
    },
    {
        "name": "Frozen-Green Peas",
        "category": "Grocery",
        "price": 135,
        "image": "https://www.bbassets.com/media/uploads/p/m/103692_2-safal-frozen-green-peas.jpg?tr=w-154,q-80"
    },
    {
        "name": "Chilli Garlic Potato Bites",
        "category": "Grocery",
        "price": 155,
        "image": "https://www.bbassets.com/media/uploads/p/m/206433_11-mccain-potato-bites-chilli-garlic.jpg?tr=w-154,q-80"
    },
    {
        "name": "Burger Patty -Chicken Jumbo",
        "category": "Grocery",
        "price": 275,
        "image": "https://www.bbassets.com/media/uploads/p/m/264796_2-venkys-burger-patty-chicken-jumbo.jpg?tr=w-154,q-80"
    },
    {
        "name": "Chicken Darjeeling Momos",
        "category": "Grocery",
        "price": 207.2,
        "image": "https://www.bbassets.com/media/uploads/p/m/40214961_7-wow-momo-chicken-darjeeling-momos.jpg?tr=w-154,q-80"
    },
    {
        "name": "Mini Samosa-Cheese Pizza",
        "category": "Grocery",
        "price": 165,
        "image": "https://www.bbassets.com/media/uploads/p/m/40099224_10-mccain-mini-samosa-cheese-pizza.jpg?tr=w-154,q-80"
    },
    {
        "name": "Plant-Based Chicken Awadhi Seekh Kebab",
        "category": "Grocery",
        "price": 350,
        "image": "https://www.bbassets.com/media/uploads/p/m/40267385_3-tata-simply-better-plant-based-awadhi-seekh-kebab-rich-in-protein-no-added-preservatives.jpg?tr=w-154,q-80"
    },
    {
        "name": "Matic Top Load Detergent Powder 2kg",
        "category": "Grocery",
        "price": 951.2,
        "image": "https://www.bbassets.com/media/uploads/p/m/1214684_1-ariel-detergent-washing-powder-matic-top-load-2kg-matic-3-in-1-pods-detergent-357g.jpg?tr=w-154,q-80"
    },
    {
        "name": "Anti Bacterial Liquid Detergent Pods-30pcs",
        "category": "Grocery",
        "price": 660,
        "image": "https://www.bbassets.com/media/uploads/p/m/40225626_1-safewash-anti-bacterial-liquid-detergent-pods-for-front-top-load-washing-machines.jpg?tr=w-154,q-80"
    },
    {
        "name": "Matic Front Load Liquid Detergent 2.5L+Super",
        "category": "Grocery",
        "price": 823,
        "image": "https://www.bbassets.com/media/uploads/p/m/1220939_1-ariel-matic-liquid-detergent-front-load-2-l-get-500ml-free-2-l-super-saver-pack.jpg?tr=w-154,q-80"
    },
    {
        "name": "Oxi Action All In One Stain Remover",
        "category": "Grocery",
        "price": 105,
        "image": "https://www.bbassets.com/media/uploads/p/m/40095683_5-vanish-all-in-one-colour-safe-detergent-booster-oxi-action.jpg?tr=w-154,q-80"
    },
    {
        "name": "Easy Wash Detergent Powder",
        "category": "Grocery",
        "price": 1176.75,
        "image": "https://www.bbassets.com/media/uploads/p/m/1226809_3-surf-excel-easy-wash-detergent-powder.jpg?tr=w-154,q-80"
    },
    {
        "name": "Detergent Washing Powder-Lemon&Mint",
        "category": "Grocery",
        "price": 573.33,
        "image": "https://www.bbassets.com/media/uploads/p/m/40128634_5-tide-detergent-washing-powder-lemon-mint-extra-power-tide.jpg?tr=w-154,q-80"
    }
]

products_col.insert_many(products)
print("✅ Products inserted successfully.")