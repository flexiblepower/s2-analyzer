import asyncio
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Optional

from bidict import bidict

S = TypeVar('S')


class AsyncSelectable(ABC, Generic[S]):
    _select_result: Optional['S']

    @abstractmethod
    async def select_task(self) -> 'S':
        pass

    def set_last_select_result(self, select_result: 'S') -> None:
        if self._select_result is not None:
            raise RuntimeError(f'Cannot set the last select result as it is still set with an unretrieved '
                               f'value {self._select_result}')
        self._select_result = select_result

    def retrieve_last_select_result(self) -> 'S':
        if self._select_result is None:
            raise RuntimeError('Cannot retrieve the last select result as it is None')

        result = self._select_result
        self._select_result = None
        return result


class AsyncSelect(Generic[S]):
    _selectables: list[AsyncSelectable['S']]
    _task_for_selectable: bidict[AsyncSelectable, asyncio.Task]
    _ping_to_restart: asyncio.Event
    _ping_to_restart_task: asyncio.Task

    def __init__(self, selectables: list[AsyncSelectable['S']]):
        self._selectables = selectables.copy()

    async def select(self) -> tuple[list[AsyncSelectable['S']], list[AsyncSelectable['S']]]:
        select_tasks = []
        for selectable in self._selectables:
            task = self._task_for_selectable.get(selectable)
            if not task:
                task = asyncio.create_task(selectable.select_task())
                self._task_for_selectable[selectable] = task
            select_tasks.append(task)

        self._ping_to_restart.clear()
        if not self._ping_to_restart_task:
            self._ping_to_restart_task = asyncio.create_task(self._ping_to_restart.wait())
        select_tasks.append(self._ping_to_restart_task)

        completed, pending = await asyncio.wait(select_tasks,
                                                return_when=asyncio.FIRST_COMPLETED)

        completed_selectables = []
        for complete_task in completed:
            completed_selectable = self._task_for_selectable.inverse[complete_task]
            del self._task_for_selectable[completed_selectable]
            completed_selectables.append(completed_selectable)
            completed_selectable.set_last_select_result(complete_task.result())

        pending_selectables = []
        for pending_task in pending:
            pending_selectable = self._task_for_selectable.inverse[pending_task]
            pending_selectables.append(pending_selectable)

        return completed_selectables, pending_selectables

    async def add_selectable(self, selectable: AsyncSelectable['S']):
        """Add a selectable to an already-running select.

        Async-thread safe.

        :param selectable: The selectable to add.
        :return:
        """
        self._selectables.append(selectable)
        self._ping_to_restart.set()

    async def remove_selectable(self, selectable: AsyncSelectable['S']):
        self._selectables.remove(selectable)
        self._ping_to_restart.set()
