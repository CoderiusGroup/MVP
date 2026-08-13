import abc


class IDeviceRepository(abc.ABC):
    """def __init__(self, id, name, operatingSystem, description):
    self.id = id
    self.name = name
    self.operatingSystem = operatingSystem
    self.description = description"""

    @abc.abstractmethod
    def get(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def save(self, device):
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def list(self):
        raise NotImplementedError
