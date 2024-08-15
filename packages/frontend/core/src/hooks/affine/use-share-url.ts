import { notify } from '@affine/component';
import { track } from '@affine/core/mixpanel';
import { getAffineCloudBaseUrl } from '@affine/core/modules/cloud/services/fetch';
import { useI18n } from '@affine/i18n';
import type { Disposable } from '@blocksuite/global/utils';
import { type DocMode } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { useActiveBlocksuiteEditor } from '../use-block-suite-editor';

type UseSharingUrl = {
  workspaceId: string;
  pageId: string;
  shareView?: DocMode;
};

const generateUrl = ({
  workspaceId,
  pageId,
  blockId,
  shareView,
}: UseSharingUrl & { blockId?: string }) => {
  // to generate a url like https://app.affine.pro/workspace/123/456
  // or https://app.affine.pro/workspace/123/456#block-123
  // or https://app.affine.pro/workspace/123/456?view=edgeless
  const baseUrl = getAffineCloudBaseUrl();
  if (!baseUrl) return null;

  try {
    return new URL(
      `${baseUrl}/workspace/${workspaceId}/${pageId}${shareView ? `?view=${shareView}` : ''}${blockId ? `#${blockId}` : ''}`
    ).toString();
  } catch (e) {
    return null;
  }
};

const getShareLinkType = ({
  view,
  blockId,
}: {
  view?: DocMode;
  blockId?: string;
}) => {
  if (view === 'page') {
    return 'doc';
  } else if (view === 'edgeless') {
    return 'whiteboard';
  } else if (blockId) {
    return 'block';
  } else {
    return 'default';
  }
};

export const useSharingUrl = ({ workspaceId, pageId }: UseSharingUrl) => {
  const t = useI18n();
  const [blockId, setBlockId] = useState<string>('');
  const [editor] = useActiveBlocksuiteEditor();

  const onClickCopyLink = useCallback(
    (view?: DocMode) => {
      const sharingUrl = generateUrl({
        workspaceId,
        pageId,
        blockId,
        shareView: view, // if view is not provided, use the current view
      });
      const type = getShareLinkType({
        view,
        blockId,
      });
      if (sharingUrl) {
        navigator.clipboard
          .writeText(sharingUrl)
          .then(() => {
            notify.success({
              title: t['Copied link to clipboard'](),
            });
          })
          .catch(err => {
            console.error(err);
          });
        track.$.sharePanel.$.copyShareLink({
          type,
        });
      } else {
        notify.error({
          title: 'Network not available',
        });
      }
    },
    [blockId, pageId, t, workspaceId]
  );

  useEffect(() => {
    let disposable: Disposable | null = null;
    const selectManager = editor?.host?.selection;
    if (!selectManager) {
      return;
    }

    // if the block is already selected, set the blockId
    const currentBlockSelection = selectManager.find('block');
    if (currentBlockSelection) {
      setBlockId(currentBlockSelection.blockId);
    }

    disposable = selectManager.slots.changed.on(selections => {
      setBlockId(prev => {
        if (selections[0] && selections[0].type === 'block') {
          return selections[0].blockId;
        } else if (prev.length > 0) {
          return '';
        } else {
          return prev;
        }
      });
    });
    return () => {
      disposable?.dispose();
    };
  }, [editor?.host?.selection]);
  return {
    onClickCopyLink,
  };
};
