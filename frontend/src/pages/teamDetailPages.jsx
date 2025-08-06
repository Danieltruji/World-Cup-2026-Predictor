import React from 'react';
import { useParams } from 'react-router-dom';
import teamsByContinent from '../data/teamInfo';

export default function TeamDetailPage() {
  const { teamId } = useParams();
  const team = Object.values(teamsByContinent).flat().find(t => t.id === teamId);

  if (!team) return <p>Team not found</p>;

  return (
    <div>
      <h1>{team.name}</h1>
      <p>{team.fullHistory}</p>
    </div>
  );
}
