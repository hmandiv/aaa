import React from "react";
import hr from "../images/hr.png";
import shawn from "../images/shawn.png";
import scott from "../images/scott.png";
import styles from "../css_modules/AAATeamStyles.module.css";

const teamMembers = [
  {
    name: "Scott Gerrard",
    role: "Founder & CEO",
    image: scott,
    bio: "Scott is the visionary behind AAA. With years of experience in the tech industry, he leads the team with passion and expertise.",
  },
  {
    name: "Tiny Lion Coder",
    role: "Lead Developer",
    image: hr,
    bio: "He is in charge of the technical architecture, ensuring everything runs smoothly.",
  },
  {
    name: "Shawn Ziem",
    role: "Marketing Lead",
    image: shawn,
    bio: "Shawn drives the marketing strategy, helping AAA reach new heights and a broader audience.",
  },
  //   {
  //     name: "Emily Johnson",
  //     role: "Community Manager",
  //     image: "https://via.placeholder.com/150",
  //     bio: "Emily ensures our community remains engaged and informed, fostering a strong connection between the team and users.",
  //   },
];

export const AAATeam: React.FC = () => (
  <div className={styles.container}>
    <h1 className={styles.heading}>Meet the AAA Team</h1>
    <p className={styles.description}>
      Our dedicated team works tirelessly to make AAA a success. Get to know the
      people behind the project!
    </p>
    <div className={styles.teamGrid}>
      {teamMembers.map((member, index) => (
        <div key={index} className={styles.teamMember}>
          <img src={member.image} alt={member.name} className={styles.image} />
          <h2 className={styles.name}>{member.name}</h2>
          <h3 className={styles.role}>{member.role}</h3>
          <p className={styles.bio}>{member.bio}</p>
        </div>
      ))}
    </div>
  </div>
);

export default AAATeam;
