import { IdBuilder } from '@/model/tools';

export class IdHelper extends IdBuilder {
  private readonly idBuilders: Map<string, IdBuilder> = new Map<string, IdBuilder>();
  public forGroup(group: string): IdBuilder {
    const { idBuilders } = this;
    if (!idBuilders.has(group)) {
      idBuilders.set(group, new IdBuilder());
    }

    return idBuilders.get(group) as IdBuilder;
  }
}
