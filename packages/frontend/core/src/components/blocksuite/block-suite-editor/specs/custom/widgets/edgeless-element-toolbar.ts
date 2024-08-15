import { LinkIcon } from '@blocksuite/icons/lit';
import type { FrameworkProvider } from '@toeverything/infra';

export function createEdgelessElementToolbarWidgetConfig(
  _framework: FrameworkProvider
) {
  return {
    configureMoreMenu: groups => {
      const clipboardGroup = groups.find(group => group.type === 'clipboard');

      if (clipboardGroup) {
        const copyIndex = clipboardGroup.items.findIndex(
          item => item.type === 'copy'
        );
        clipboardGroup.items.splice(copyIndex + 1, 0, {
          icon: LinkIcon({ width: '20', height: '20' }),
          name: 'Copy link to block',
          type: 'copyLinkToBlock',
          action: ctx => console.log(ctx),
          showWhile: ctx => ctx.isSingle(),
        });
      }

      return groups;
    },
  };
}
