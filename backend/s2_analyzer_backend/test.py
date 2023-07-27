import asyncio
from s2_analyzer_backend.rest_api import RestAPI

rest_api = RestAPI('0.0.0.0', 8001, None)
async def test():

    await rest_api.main_task(None)


async def timer_test():
    await asyncio.sleep(10)
    rest_api.stop(None)



asyncio.get_event_loop().run_until_complete(asyncio.gather(test(), timer_test()))




