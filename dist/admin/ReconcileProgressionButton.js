'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { Button, toast, useConfig } from '@payloadcms/ui';
import { useCallback, useState } from 'react';
/**
 * Grants list control — runs progression reconcile for all users with grants.
 */
export function ReconcileProgressionButton(props) {
    const { reconcilePath } = props;
    const { config } = useConfig();
    const [busy, setBusy] = useState(false);
    const onClick = useCallback(async () => {
        if (busy)
            return;
        setBusy(true);
        try {
            const serverURL = config.serverURL?.replace(/\/$/, '') ?? '';
            const url = `${serverURL}${reconcilePath.startsWith('/') ? reconcilePath : `/${reconcilePath}`}`;
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const json = (await res.json().catch(() => null));
            if (!res.ok) {
                const message = json?.errors?.[0]?.message ?? `Request failed (${res.status})`;
                toast.error(message);
                return;
            }
            toast.success(`Repair complete — users ${json?.usersScanned ?? 0}, grants ${json?.compositesGranted ?? 0}, logs ${json?.grantedLogsBackfilled ?? 0}, requests ${json?.achievementRequestsEnsured ?? 0}, tier requests ${json?.tierRequestsEnsured ?? 0}`);
        }
        catch (error) {
            toast.error(error instanceof Error ? error.message : 'Repair failed');
        }
        finally {
            setBusy(false);
        }
    }, [busy, config.serverURL, reconcilePath]);
    return (_jsx("div", { style: { marginBottom: '1rem' }, children: _jsx(Button, { buttonStyle: "secondary", disabled: busy, onClick: () => void onClick(), children: busy ? 'Repairing…' : 'Repair progression' }) }));
}
