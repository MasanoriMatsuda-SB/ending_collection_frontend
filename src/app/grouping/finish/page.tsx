// app/grouping/finish/page.tsx
'use client';

import { Suspense } from 'react';
import GroupingFinishContent from './GroupingFinishContent';

export default function GroupingFinishPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <GroupingFinishContent />
    </Suspense>
  );
}