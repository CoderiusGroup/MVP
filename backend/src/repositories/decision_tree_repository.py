import abc


class IDecisionTreeRepository(abc.ABC):
    @abc.abstractmethod
    def get(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def save(self, decision_tree):
        raise NotImplementedError

    @abc.abstractmethod
    def delete(self, id):
        raise NotImplementedError

    @abc.abstractmethod
    def list(self):
        raise NotImplementedError
