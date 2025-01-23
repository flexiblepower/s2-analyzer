import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef, MRT_RowSelectionState, useMaterialReactTable } from 'material-react-table';
import MessageHeader from '../../models/messages/messageHeader';
import MessagePopUp from '../popups/MessagePopUp';

interface MessageTableProps<T extends MessageHeader> {
    messages: T[];
}

function MessageTable<T extends MessageHeader>({ messages }: MessageTableProps<T>) {
    const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
    const [selectedMessages, setSelectedMessages] = useState<T[]>([]);

    // Memoize columns for performance
    const columns = useMemo<MRT_ColumnDef<T>[]>(() => [
        {
            accessorKey: 'message_id',
            header: 'Message ID',
        },
        {
            accessorKey: 'message_type',
            header: 'Message Type',
        },
        {
            accessorKey: 'sender',
            header: 'Sender',
        },
        {
            accessorKey: 'time',
            header: 'Timestamp',
            accessorFn: (row) => {
                const date = new Date(row.time);
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            },
        },
    ], []);

    // Use MaterialReactTable hook
    const table = useMaterialReactTable({
        columns,
        data: messages, // Ensure messages are stable or memoized
        enableRowSelection: true,
        initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
        autoResetPageIndex: false,
        enableColumnResizing: true,
        enableStickyHeader: true,
        enableStickyFooter: true,

        getRowId: (row) => row.message_id,
        onRowSelectionChange: setRowSelection,
        state: { rowSelection },

        muiTableProps: {
            sx: {height: 'calc(100vh - 300px)'},
        },
        muiTableBodyRowProps: ({ row }) => ({
            onClick: row.getToggleSelectedHandler(),
            sx: {
                cursor: 'pointer',
                backgroundColor: typeof row.original.status === 'string' &&
                                 row.original.status.includes('validation not successful') ? 'red' : 'inherit'
            },
        }),
    });

    // Update selectedMessages only when rowSelection changes
    useEffect(() => {
        const selected = messages.filter((message) =>
            Object.keys(rowSelection).includes(message.message_id)
        );
        setSelectedMessages(selected);
    }, [rowSelection, messages]);

    return (
        <>
            <MaterialReactTable table={table} />
            {selectedMessages.map((message) => (
                <MessagePopUp
                    key={message.message_id}
                    trigger
                    setTrigger={() =>
                        setRowSelection((prev) => {
                            const newSelection = { ...prev };
                            delete newSelection[message.message_id];
                            return newSelection;
                        })
                    }
                    message={message}
                />
            ))}
        </>
    );
}

export default MessageTable;
