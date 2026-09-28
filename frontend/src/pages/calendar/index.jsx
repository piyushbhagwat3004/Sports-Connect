import React from 'react';
import styles from './styles.module.css';
import UserLayout from '@/layout/UserLayout';
import { useState } from 'react';
const sportsData = [
  {
    name: "Soccer (Football)",
    description: "Soccer, also known as football, is the world's most popular sport, played by over 250 million players in over 200 countries. The game is played on a rectangular field with a goal at each end. The aim is to score by getting the ball into the opposing goal. The FIFA World Cup is the most prestigious tournament.",
    recentWinner: "FIFA World Cup Winner: Argentina (2022)",
    link: "https://www.fifa.com"
  },
  {
    name: "Cricket",
    description: "Cricket is a bat-and-ball game played between two teams of eleven players. Popular in countries like India, Australia, England, and Pakistan. The ICC organizes tournaments like the Cricket World Cup, T20 World Cup, and the World Test Championship.",
    recentWinner: "ICC ODI World Cup Winner: Australia (2023)",
    link: "https://www.icc-cricket.com/tournaments/world-test-championship"
  },
  {
    name: "Hockey (Field & Ice)",
    description: "Hockey is a team sport played either on ice (ice hockey) or on field (field hockey). It is widely popular in countries like Canada, India, and the Netherlands.",
    recentWinner: "Olympic Gold (Men's Field Hockey): Belgium (2020)",
    link: "https://www.fih.hockey"
  },
  {
    name: "Basketball",
    description: "Basketball is a team sport played on a rectangular court with two teams of five players each. The objective is to shoot a basketball through the opponent's hoop. The NBA is the premier professional league, with the Olympics and FIBA World Cup being major international competitions.",
    recentWinner: "NBA Champions: Denver Nuggets (2023)",
    link: "https://www.nba.com"
  },
  {
    name: "Tennis",
    description: "Tennis is a racket sport played individually against a single opponent or between two teams of two players each. The four Grand Slam tournaments (Wimbledon, US Open, French Open, Australian Open) are the most prestigious events in tennis.",
    recentWinner: "Wimbledon 2023: Carlos Alcaraz (Men's), Marketa Vondrousova (Women's)",
    link: "https://www.atptour.com"
  },
  {
    name: "Volleyball",
    description: "Volleyball is a team sport in which two teams of six players are separated by a net. The objective is to send the ball over the net and ground it on the opponent's court. It's popular worldwide with both indoor and beach variants.",
    recentWinner: "Olympic Gold (Men's): France (2020)",
    link: "https://www.fivb.com"
  },
  {
    name: "Baseball",
    description: "Baseball is a bat-and-ball game played between two teams of nine players each. Extremely popular in the United States, Japan, and several Latin American countries. Major League Baseball (MLB) is the premier professional league.",
    recentWinner: "World Series Champions: Texas Rangers (2023)",
    link: "https://www.mlb.com"
  },
  {
    name: "American Football",
    description: "American football is a team sport played by two teams of eleven players on a rectangular field with goalposts at each end. The NFL is the premier professional league, with the Super Bowl being one of the most-watched sporting events globally.",
    recentWinner: "Super Bowl LVII Champions: Kansas City Chiefs (2023)",
    link: "https://www.nfl.com"
  },
  {
    name: "Rugby",
    description: "Rugby is a team sport played with an oval-shaped ball by two teams of fifteen players (Rugby Union) or thirteen players (Rugby League). Popular in countries like New Zealand, South Africa, England, and Australia. The Rugby World Cup is held every four years.",
    recentWinner: "Rugby World Cup Winner: South Africa (2023)",
    link: "https://www.world.rugby"
  },
  {
    name: "Swimming",
    description: "Swimming is an individual or team racing sport that requires the use of one's entire body to move through water. The sport takes place in pools or open water. The Olympics and World Aquatics Championships are the premier competitions.",
    recentWinner: "Olympic 100m Freestyle: Caeleb Dressel (Men's), Emma McKeon (Women's) (2020)",
    link: "https://www.worldaquatics.com"
  },
  {
    name: "Athletics (Track & Field)",
    description: "Athletics comprises various competitive sporting events based on running, jumping, and throwing. It's one of the oldest forms of organized sport and a core part of the Olympic Games. Events include sprints, distance running, hurdles, jumps, and throws.",
    recentWinner: "World Championships 100m: Noah Lyles (Men's), Sha'Carri Richardson (Women's) (2023)",
    link: "https://www.worldathletics.org"
  },
  {
    name: "Golf",
    description: "Golf is a club-and-ball sport in which players use various clubs to hit balls into holes on a course in the fewest strokes. The four major championships (Masters, PGA Championship, U.S. Open, The Open Championship) are the most prestigious tournaments.",
    recentWinner: "Masters Tournament Winner: Jon Rahm (2023)",
    link: "https://www.pgatour.com"
  },
  {
    name: "Boxing",
    description: "Boxing is a combat sport in which two people fight using their fists. Boxers wear protective gloves and fight in a square ring for a predetermined number of rounds. Major sanctioning bodies include WBA, WBC, IBF, and WBO.",
    recentWinner: "Heavyweight Champion: Tyson Fury (WBC)",
    link: "https://www.wbc-boxing.org"
  },
  {
    name: "Formula 1",
    description: "Formula 1 is the highest class of international auto racing for single-seater formula racing cars. The FIA Formula One World Championship is contested over a series of races known as Grands Prix, held on purpose-built circuits and closed public roads.",
    recentWinner: "F1 World Champion: Max Verstappen (2023)",
    link: "https://www.formula1.com"
  },
  {
    name: "Badminton",
    description: "Badminton is a racquet sport played using racquets to hit a shuttlecock across a net. Popular especially in Asian countries like China, Indonesia, and India. The BWF World Championships and Olympic Games are the premier competitions.",
    recentWinner: "World Championships Men's Singles: Viktor Axelsen (2022)",
    link: "https://bwfbadminton.com"
  },
  {
    name: "Table Tennis",
    description: "Table tennis, also known as ping-pong, is a sport in which two or four players hit a lightweight ball back and forth across a table using small rackets. China dominates the sport internationally, with the Olympics and World Championships being major events.",
    recentWinner: "World Championships Men's Singles: Fan Zhendong (2023)",
    link: "https://www.ittf.com"
  },
  {
    name: "Cycling",
    description: "Cycling encompasses various disciplines including road racing, track cycling, mountain biking, and BMX. The Tour de France is the most prestigious road cycling event, while the Olympics feature multiple cycling disciplines.",
    recentWinner: "Tour de France Winner: Jonas Vingegaard (2023)",
    link: "https://www.uci.org"
  },
  {
    name: "MMA (Mixed Martial Arts)",
    description: "Mixed Martial Arts is a full-contact combat sport that allows a wide variety of fighting techniques from various martial arts and combat sports. The UFC is the premier MMA organization globally, with fighters competing in different weight classes.",
    recentWinner: "UFC Heavyweight Champion: Jon Jones (2023)",
    link: "https://www.ufc.com"
  },
  {
    name: "Gymnastics",
    description: "Gymnastics is a sport involving exercises requiring physical strength, flexibility, agility, coordination, and grace. It includes artistic gymnastics, rhythmic gymnastics, and trampoline. The Olympics and World Championships are the premier competitions.",
    recentWinner: "Olympic All-Around Champion: Sunisa Lee (Women's), Daiki Hashimoto (Men's) (2020)",
    link: "https://www.fig-gymnastics.com"
  },
  {
    name: "Skiing",
    description: "Skiing encompasses alpine skiing, cross-country skiing, ski jumping, and freestyle skiing. The Winter Olympics and FIS World Championships are major competitions. Popular in mountainous regions across Europe, North America, and Asia.",
    recentWinner: "Overall World Cup Winner: Marco Odermatt (Men's), Mikaela Shiffrin (Women's) (2023)",
    link: "https://www.fis-ski.com"
  },
  {
    name: "Wrestling",
    description: "Wrestling is a combat sport involving grappling techniques such as clinch fighting, throws, takedowns, and pins. Freestyle and Greco-Roman are the two main international styles. The sport has ancient origins and is featured in the Olympics.",
    recentWinner: "World Championships 86kg Freestyle: Hassan Yazdani (2023)",
    link: "https://unitedworldwrestling.org"
  },
  {
    name: "Weightlifting",
    description: "Weightlifting is a strength sport consisting of two lifts: the snatch and the clean and jerk. Athletes compete in various weight categories. The Olympics and World Championships are the most prestigious competitions in the sport.",
    recentWinner: "World Championships 109kg: Lasha Talakhadze (2023)",
    link: "https://www.iwf.net"
  },
  {
    name: "Judo",
    description: "Judo is a modern martial art and combat sport that originated in Japan. It emphasizes throwing techniques, pins, and submission holds. Judo is an Olympic sport with competitions organized by weight categories for both men and women.",
    recentWinner: "World Championships -90kg: Lasha Bekauri (2023)",
    link: "https://www.ijf.org"
  },
  {
    name: "Archery",
    description: "Archery is the practice of using a bow to shoot arrows at a target. Modern competitive archery involves precision shooting at targets at various distances. The Olympics and World Championships feature recurve and compound bow competitions.",
    recentWinner: "World Championships Recurve: Kim Woojin (Men's), Choi Misun (Women's) (2023)",
    link: "https://worldarchery.sport"
  },
  {
    name: "Fencing",
    description: "Fencing is a combat sport that features sword fighting with three different weapons: foil, épée, and sabre. It requires speed, tactics, and precision. The Olympics and World Championships are the premier competitions in the sport.",
    recentWinner: "World Championships Men's Foil: Alessio Foconi (2023)",
    link: "https://fie.org"
  },
  {
    name: "Sailing",
    description: "Sailing is a sport that involves racing boats using wind power. Various classes of boats compete in different conditions. The Olympics feature multiple sailing disciplines, and the America's Cup is one of the oldest international trophies.",
    recentWinner: "America's Cup Winner: Team New Zealand (2021)",
    link: "https://www.sailing.org"
  },
  {
    name: "Rowing",
    description: "Rowing is a sport where athletes race against each other in boats propelled by oars. It includes both sweep rowing and sculling. The Olympics and World Championships feature various boat classes from single sculls to eight-person crews.",
    recentWinner: "World Championships Men's Eight: Great Britain (2023)",
    link: "https://worldrowing.com"
  },
  {
    name: "Handball",
    description: "Handball is a team sport played by two teams of seven players each. Players pass, catch, and throw a ball to score goals. Very popular in Europe, with the Olympics and World Championships being major competitions.",
    recentWinner: "World Championships: Denmark (Men's 2023)",
    link: "https://www.ihf.info"
  },
  {
    name: "Water Polo",
    description: "Water polo is a team water sport played in a swimming pool. Two teams try to score goals by throwing a ball into the opponent's goal. It requires exceptional swimming ability, strength, and tactical awareness.",
    recentWinner: "World Championships: Hungary (Men's 2023)",
    link: "https://www.worldaquatics.com"
  },
  {
    name: "Surfing",
    description: "Surfing is a water sport where participants ride breaking waves toward shore on a surfboard. Recently added to the Olympics, professional surfing features competitions on natural waves around the world's best surf breaks.",
    recentWinner: "Olympic Gold: Ítalo Ferreira (Men's), Carissa Moore (Women's) (2020)",
    link: "https://www.worldsurfleague.com"
  },
  {
    name: "Skateboarding",
    description: "Skateboarding is an action sport that involves riding and performing tricks using a skateboard. It became an Olympic sport in 2020, featuring street and park disciplines. Popular globally among youth culture.",
    recentWinner: "Olympic Gold: Yuto Horigome (Men's Street), Momiji Nishiya (Women's Street) (2020)",
    link: "https://www.worldskate.org"
  },
  {
    name: "Climbing",
    description: "Sport climbing involves ascending artificial climbing walls with predetermined routes. It became an Olympic sport in 2020, featuring three disciplines: speed, bouldering, and lead. Rock climbing and mountaineering are related outdoor variants.",
    recentWinner: "Olympic Gold: Alberto Ginés López (Men's), Janja Garnbret (Women's) (2020)",
    link: "https://www.ifsc-climbing.org"
  },
  {
    name: "Equestrian",
    description: "Equestrian sports involve competitions between horse and rider partnerships. Olympic disciplines include dressage, show jumping, and eventing. The sport emphasizes harmony between horse and rider and requires years of training.",
    recentWinner: "Olympic Individual Dressage: Jessica von Bredow-Werndl (2020)",
    link: "https://www.fei.org"
  }
];

export default function CalendarComponent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSport, setSelectedSport] = useState("All");

  const allSportNames = [
    "All",
    ...Array.from(new Set(sportsData.map(sport => sport.name)))
  ];

  const filteredSports = sportsData.filter(sport => {
    const matchesSearch = (
      sport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sport.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sport.recentWinner.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesDropdown = selectedSport === "All" || sport.name === selectedSport;
    return matchesSearch && matchesDropdown;
  });

  return (
    <UserLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>🏆 Global Sports Calendar 🗓️</h1>

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.dropdown}
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            {allSportNames.map((name, idx) => (
              <option key={idx} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className={styles.grid}>
          {filteredSports.length > 0 ? (
            filteredSports.map((sport, idx) => (
              <div className={styles.card} key={idx}>
                <h2>{sport.name}</h2>
                <p>{sport.description}</p>
                <p><strong>{sport.recentWinner}</strong></p>
                <a href={sport.link} target="_blank" rel="noopener noreferrer" className={styles.button}>
                  More Information
                </a>
              </div>
            ))
          ) : (
            <p className={styles.noResults}>No sports found matching the filters.</p>
          )}
        </div>
      </div>
    </UserLayout>
  );
}