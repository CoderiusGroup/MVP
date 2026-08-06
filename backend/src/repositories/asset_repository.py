import abc


class IAssetRepository(abc.ABC):
    @abc.abstractmethod
    def get(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def save(self, asset):
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def list(self):
        raise NotImplementedError
