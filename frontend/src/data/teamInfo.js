const teamsByContinent = {
    "Europe": [
      {
        "id": "germany",
        "name": "Germany",
        "colors": ["#000000", "#DD0000", "#FFCE00"],
        "history": "Germany has appeared in 20 World Cups. Best Finish: Winners (4 times).",
        "fullHistory": "Germany has participated in the World Cup 20 times. Their best performance was Winners (4 times), with their last appearance in 2022."
      },
      {
        "id": "italy",
        "name": "Italy",
        "colors": [ "#008C45", "#F4F5F0","#CD212A"],
        "history": "Italy has appeared in 18 World Cups. Best Finish: Winners (4 times).",
        "fullHistory": "Italy has participated in the World Cup 18 times. Their best performance was Winners (4 times), with their last appearance in 2022."
      },
      {
        "id": "france",
        "name": "France",
        "colors":["#0055A4",
        "#FFFFFF",
        "#EF4135"],
        "history": "France has appeared in 16 World Cups. Best Finish: Winners (2 times).",
        "fullHistory": "France has participated in the World Cup 16 times. Their best performance was Winners (2 times), with their last appearance in 2022."
      },
      {
        "id": "england",
        "name": "England",
        "colors": [
        "#FFFFFF",
        "#C8102E"],
        "history": "Historic World Cup team",
        "fullHistory": "England has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "spain",
        "name": "Spain",
        "colors": ["#8B0D11", "#FCB507", "#021250"],
        "history": "Historic World Cup team",
        "fullHistory": "Spain has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "netherlands",
        "name": "Netherlands",
        "colors":["#FF6600", "#FFFFFF", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Netherlands has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "portugal",
        "name": "Portugal",
        "colors": ["#006600", "#FF0000", "#FFCC00"],
        "history": "Historic World Cup team",
        "fullHistory": "Portugal has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "belgium",
        "name": "Belgium",
        "colors": ["#8A0B11", "#FFCC00", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Belgium has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "croatia",
        "name": "Croatia",
        "colors":["#FF0000", "#FFFFFF", "#0055A4"],
        "history": "Historic World Cup team",
        "fullHistory": "Croatia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "sweden",
        "name": "Sweden",
        "colors": ["#005B99", "#FECC00"],
        "history": "Historic World Cup team",
        "fullHistory": "Sweden has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "russia",
        "name": "Russia",
        "colors": ["#FFFFFF", "#0039A6", "#D52B1E"],
        "history": "Historic World Cup team",
        "fullHistory": "Russia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "switzerland",
        "name": "Switzerland",
        "colors": ["#FF0000", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Switzerland has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "poland",
        "name": "Poland",
        "colors": ["#FFFFFF", "#FF0000"], 
        "history": "Historic World Cup team",
        "fullHistory": "Poland has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "ukraine",
        "name": "Ukraine",
        "colors": ["#FFE000", "#0040FF"],
        "history": "Historic World Cup team",
        "fullHistory": "Ukraine has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "denmark",
        "name": "Denmark",
        "colors": ["#C60C30", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Denmark has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "serbia",
        "name": "Serbia",
        "colors": ["#FF0000", "#0000CB", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Serbia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "romania",
        "name": "Romania",
        "colors": ["#002B7F", "#FCD116", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Romania has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "czech-republic",
        "name": "Czech Republic",
        "colors":["#FFFFFF", "#11457E", "#D7141A"],
        "history": "Historic World Cup team",
        "fullHistory": "Czech Republic has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "austria",
        "name": "Austria",
        "colors":["#ED2939", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Austria has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "hungary",
        "name": "Hungary",
        "colors": ["#00873E", "#FFFFFF", "#CD212A"],
        "history": "Historic World Cup team",
        "fullHistory": "Hungary has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "scotland",
        "name": "Scotland",
        "colors": ["#006AFF", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Scotland has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "wales",
        "name": "Wales",
        "colors": ["#D70810", "#FFFFFF", "#009A17"],
        "history":"Historic World Cup team",
        "fullHistory": "Wales has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "norway",
        "name": "Norway",
        "colors": ["#BA0C2F", "#00205B", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Norway has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "slovakia",
        "name": "Slovakia",
        "colors": ["#FFFFFF", "#00205B", "#D7141A"],
        "history": "Historic World Cup team",
        "fullHistory": "Slovakia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "greece",
        "name": "Greece",
        "colors":  ["#0D5EAF", "#FFFFFF"], 
        "history": "Historic World Cup team",
        "fullHistory": "Greece has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "bulgaria",
        "name": "Bulgaria",
        "colors": ["#FFFFFF", "#00966E", "#D6122E"],
        "history": "Historic World Cup team",
        "fullHistory": "Bulgaria has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "slovenia",
        "name": "Slovenia",
        "colors":  ["#FFFFFF", "#005BBB", "#009543"],
        "history": "Historic World Cup team",
        "fullHistory": "Slovenia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "finland",
        "name": "Finland",
        "colors": ["#FFFFFF", "#003580"], 
        "history": "Historic World Cup team",
        "fullHistory": "Finland has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "turkey",
        "name": "Turkey",
        "colors": ["#E30A17", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Turkey has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "republic-of-ireland",
        "name": "Republic of Ireland",
        "colors": ["#169B62", "#FFFFFF", "#FF883E"],
        "history": "Historic World Cup team",
        "fullHistory": "Republic of Ireland has participated in past World Cups and made its mark on international football."
      }
    ],
    "SouthAmerica": [
      {
        "id": "brazil",
        "name": "Brazil",
        "colors": ["#002776", "#FEDF00", "#009739"],
        "history": "Brazil has appeared in 22 World Cups. Best Finish: Winners (5 times).",
        "fullHistory": "Brazil has participated in the World Cup 22 times. Their best performance was Winners (5 times), with their last appearance in 2022."
      },
      {
        "id": "argentina",
        "name": "Argentina",
        "colors" : ["#74ACDF", "#FFFFFF", "#F6B40E"],
        "history": "Argentina has appeared in 18 World Cups. Best Finish: Winners (3 times).",
        "fullHistory": "Argentina has participated in the World Cup 18 times. Their best performance was Winners (3 times), with their last appearance in 2022."
      },
      {
        "id": "uruguay",
        "name": "Uruguay",
        "colors": ["#5BC2E7", "#FFFFFF", "#000000"],
        "history": "Uruguay has appeared in 14 World Cups. Best Finish: Winners (2 times).",
        "fullHistory": "Uruguay has participated in the World Cup 14 times. Their best performance was Winners (2 times), with their last appearance in 2022."
      },
      {
        "id": "chile",
        "name": "Chile",
        "colors": ["#DE001C", "#FFFFFF", "#0039A6"],
        "history": "Historic World Cup team",
        "fullHistory": "Chile has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "colombia",
        "name": "Colombia",
        "colors": ["#FFDD00", "#0033A0", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Colombia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "peru",
        "name": "Peru",
        "colors": ["#FFFFFF", "#E30B17"],
        "history": "Historic World Cup team",
        "fullHistory": "Peru has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "paraguay",
        "name": "Paraguay",
        "colors": ["#FFFFFF", "#003EA5", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Paraguay has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "ecuador",
        "name": "Ecuador",
        "colors": ["#FFEA00", "#0032A0", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Ecuador has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "bolivia",
        "name": "Bolivia",
        "colors": ["#D52B1E", "#FFDD00", "#007A3D"],
        "history": "Historic World Cup team",
        "fullHistory": "Bolivia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "venezuela",
        "name": "Venezuela",
        "colors": ["#00247D", "#FCD116", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Venezuela has participated in past World Cups and made its mark on international football."
      }
    ],
    "NorthAmerica": [
      {
        "id": "mexico",
        "name": "Mexico",
        "colors": ["#006847", "#FFFFFF", "#CE1126"],
        "history": "Mexico has appeared in 17 World Cups. Best Finish: Quarter-finals.",
        "fullHistory": "Mexico has participated in the World Cup 17 times. Their best performance was Quarter-finals, with their last appearance in 2022."
      },
      {
        "id": "united-states",
        "name": "United States",
        "colors": ["#B22234", "#FFFFFF", "#3C3B6E"],
        "history": "United States has appeared in 11 World Cups. Best Finish: Semi-finals (1930).",
        "fullHistory": "United States has participated in the World Cup 11 times. Their best performance was Semi-finals (1930), with their last appearance in 2022."
      },
      {
        "id": "canada",
        "name": "Canada",
        "colors": ["#FF0000", "#FFFFFF"],
        "history": "Canada has appeared in 2 World Cups. Best Finish: Group Stage.",
        "fullHistory": "Canada has participated in the World Cup 2 times. Their best performance was Group Stage, with their last appearance in 2022."
      },
      {
        "id": "costa-rica",
        "name": "Costa Rica",
        "colors": ["#DC0000", "#FFFFFF", "#0039A6"],
        "history": "Historic World Cup team",
        "fullHistory": "Costa Rica has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "honduras",
        "name": "Honduras",
        "colors": ["#004882", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Honduras has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "el-salvador",
        "name": "El Salvador",
        "colors": ["#0073CF", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "El Salvador has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "jamaica",
        "name": "Jamaica",
        "colors": ["#009B3A", "#FED100", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Jamaica has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "trinidad-and-tobago",
        "name": "Trinidad and Tobago",
        "colors": ["#E41B17", "#000000", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Trinidad and Tobago has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "cuba",
        "name": "Cuba",
        "colors": ["#002A8F", "#FFFFFF", "#D21034"],
        "history": "Historic World Cup team",
        "fullHistory": "Cuba has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "haiti",
        "name": "Haiti",
        "colors": ["#00209F", "#FFFFFF", "#EF3340"],
        "history": "Historic World Cup team",
        "fullHistory": "Haiti has participated in past World Cups and made its mark on international football."
      }
    ],
    "Africa": [
      {
        "id": "nigeria",
        "name": "Nigeria",
        "colors":["#008751", "#FFFFFF"], 
        "history": "Nigeria has appeared in 6 World Cups. Best Finish: Round of 16.",
        "fullHistory": "Nigeria has participated in the World Cup 6 times. Their best performance was Round of 16, with their last appearance in 2018."
      },
      {
        "id": "cameroon",
        "name": "Cameroon",
        "colors":  ["#007A5E", "#FFDF00", "#CE1126"],
        "history": "Cameroon has appeared in 8 World Cups. Best Finish: Quarter-finals.",
        "fullHistory": "Cameroon has participated in the World Cup 8 times. Their best performance was Quarter-finals, with their last appearance in 2022."
      },
      {
        "id": "ghana",
        "name": "Ghana",
        "colors": ["#006B3F", "#FFB612", "#CE1126"], 
        "history": "Ghana has appeared in 4 World Cups. Best Finish: Quarter-finals.",
        "fullHistory": "Ghana has participated in the World Cup 4 times. Their best performance was Quarter-finals, with their last appearance in 2022."
      },
      {
        "id": "senegal",
        "name": "Senegal",
        "colors": ["#00853F", "#FDEF43", "#E31B23"],
        "history": "Historic World Cup team",
        "fullHistory": "Senegal has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "morocco",
        "name": "Morocco",
        "colors":  ["#C1272D", "#006233", "#FFFFFF"], 
        "history": "Historic World Cup team",
        "fullHistory": "Morocco has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "algeria",
        "name": "Algeria",
        "colors": ["#006233", "#FFFFFF", "#D21034"],
        "history": "Historic World Cup team",
        "fullHistory": "Algeria has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "tunisia",
        "name": "Tunisia",
        "colors": ["#E30A17", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Tunisia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "egypt",
        "name": "Egypt",
        "colors": ["#CE1126", "#FFFFFF", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Egypt has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "south-africa",
        "name": "South Africa",
        "colors": ["#006747", "#FFB612", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "South Africa has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "angola",
        "name": "Angola",
        "colors": ["#CE1126", "#000000", "#FFD100"],
        "history": "Historic World Cup team",
        "fullHistory": "Angola has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "togo",
        "name": "Togo",
        "colors": ["#006E33", "#FED500", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Togo has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "ivory-coast",
        "name": "Ivory Coast",
        "colors": ["#FF7900", "#006A44", "#FFFFFF"],
        "history": "Historic World Cup team",
        "fullHistory": "Ivory Coast has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "zaire",
        "name": "Zaire",
        "colors":  ["#138D75", "#F4D03F", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Zaire has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "congo-dr",
        "name": "Congo DR",
        "colors": ["#0066B3", "#F4DC00", "#000000"],
        "history": "Historic World Cup team",
        "fullHistory": "Congo DR has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "mali",
        "name": "Mali",
        "colors":["#14B53A", "#FCD116", "#CE1126"],
        "history": "Historic World Cup team",
        "fullHistory": "Mali has participated in past World Cups and made its mark on international football."
      }
    ],
    "Asia": [
      {
        "id": "japan",
        "name": "Japan",
        "history": "Japan has appeared in 7 World Cups. Best Finish: Round of 16.",
        "fullHistory": "Japan has participated in the World Cup 7 times. Their best performance was Round of 16, with their last appearance in 2022."
      },
      {
        "id": "south-korea",
        "name": "South Korea",
        "history": "South Korea has appeared in 11 World Cups. Best Finish: 4th Place (2002).",
        "fullHistory": "South Korea has participated in the World Cup 11 times. Their best performance was 4th Place (2002), with their last appearance in 2022."
      },
      {
        "id": "iran",
        "name": "Iran",
        "history": "Iran has appeared in 6 World Cups. Best Finish: Group Stage.",
        "fullHistory": "Iran has participated in the World Cup 6 times. Their best performance was Group Stage, with their last appearance in 2022."
      },
      {
        "id": "saudi-arabia",
        "name": "Saudi Arabia",
        "history": "Historic World Cup team",
        "fullHistory": "Saudi Arabia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "australia",
        "name": "Australia",
        "history": "Historic World Cup team",
        "fullHistory": "Australia has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "china",
        "name": "China",
        "history": "Historic World Cup team",
        "fullHistory": "China has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "iraq",
        "name": "Iraq",
        "history": "Historic World Cup team",
        "fullHistory": "Iraq has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "kuwait",
        "name": "Kuwait",
        "history": "Historic World Cup team",
        "fullHistory": "Kuwait has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "qatar",
        "name": "Qatar",
        "history": "Historic World Cup team",
        "fullHistory": "Qatar has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "united-arab-emirates",
        "name": "United Arab Emirates",
        "history": "Historic World Cup team",
        "fullHistory": "United Arab Emirates has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "north-korea",
        "name": "North Korea",
        "history": "Historic World Cup team",
        "fullHistory": "North Korea has participated in past World Cups and made its mark on international football."
      },
      {
        "id": "indonesia",
        "name": "Indonesia",
        "history": "Historic World Cup team",
        "fullHistory": "Indonesia has participated in past World Cups and made its mark on international football."
      }
    ],
    "Oceania": [
      {
        "id": "new-zealand",
        "name": "New Zealand",
        "colors": ["#FFFFFF", "#000000"],
        "history": "New Zealand has appeared in 2 World Cups. Best Finish: Group Stage.",
        "fullHistory": "New Zealand has participated in the World Cup 2 times. Their best performance was Group Stage, with their last appearance in 2010."
      }
    ]
  };
  
  export default teamsByContinent;