import { motion } from 'motion/react';
import { Changelog1 } from '../components/ui/changelog-1';
import { useAppStore } from '../store';

export function Changelog() {
  const { changelogEntries } = useAppStore();

  const formattedEntries = changelogEntries.map(entry => ({
    version: entry.category,
    date: new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    title: entry.title,
    description: entry.description,
    items: [],
  }));

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <Changelog1 
        title="Changelog & Updates" 
        description="Keep track of the latest updates, bug fixes, and AI Chat changes." 
        entries={formattedEntries.length > 0 ? formattedEntries : undefined}
      />
    </div>
  );
}

