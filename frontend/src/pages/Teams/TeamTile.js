import React from "react";

const TeamTile = ({ team, view }) => {
    return (
        <div className={`team-tile ${view}`}>
            <div className="team-header">
                <img src={team.admin.profile_image} alt={team.admin.name} className="team-admin-img" />
                <h3>{team.name}</h3>
            </div>
            <div className="team-members">
                {team.members.map((member, index) => (
                    <img key={index} src={member.profile_image} alt={member.name} className="team-member-img" />
                ))}
            </div>
            <p>Projects: {team.projects.map((p) => p.name).join(", ")}</p>
        </div>
    );
};

export default TeamTile;
